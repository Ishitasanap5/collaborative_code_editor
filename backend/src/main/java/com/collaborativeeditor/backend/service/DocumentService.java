package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.dto.CreateDocumentRequest;
import com.collaborativeeditor.backend.dto.DocumentResponse;
import com.collaborativeeditor.backend.dto.UpdateDocumentRequest;
import com.collaborativeeditor.backend.entity.*;
import com.collaborativeeditor.backend.repository.DocumentRepository;
import com.collaborativeeditor.backend.repository.RoomMembershipRepository;
import com.collaborativeeditor.backend.repository.RoomRepository;
import com.collaborativeeditor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentRepository documentRepository;
    private final UserRepository userRepository;
    private final RoomRepository roomRepository;
    private final RoomMembershipRepository roomMembershipRepository;

    public DocumentResponse getDocumentForUser(Long documentId, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        RoomMembership membership = getMembership(document, user.getId());
        requireApproved(membership);

        return DocumentResponse.builder()
                .id(document.getId())
                .name(document.getName())
                .content(document.getContent())
                .language(document.getLanguage())
                .roomId(document.getRoom().getId())
                .roomName(document.getRoom().getName())
                .baselineVersion(document.getCrdtBaselineVersion())
                .build();
    }

    public Document createDocument(CreateDocumentRequest request, String email) {
        User user = getUser(email);

        if (request.getRoomId() == null) {
            throw new RuntimeException("Room ID is required");
        }

        Room room = roomRepository.findById(request.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));

        RoomMembership membership = roomMembershipRepository
                .findByRoomIdAndUserId(room.getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this room"));

        requireApproved(membership);

        if (membership.getRole() == RoomRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot create documents");
        }

        Document document = new Document();
        document.setName(request.getName());
        document.setLanguage(request.getLanguage());
        document.setContent(request.getContent());
        document.setRoom(room);

        return documentRepository.save(document);
    }

    public Document updateDocument(Long documentId, UpdateDocumentRequest request, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        RoomMembership membership = getMembership(document, user.getId());
        requireApproved(membership);

        if (membership.getRole() == RoomRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot edit documents");
        }

        document.setName(request.getName());
        document.setLanguage(request.getLanguage());
        document.setContent(request.getContent());

        return documentRepository.save(document);
    }

    public void deleteDocument(Long documentId, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        RoomMembership membership = getMembership(document, user.getId());
        requireApproved(membership);

        if (membership.getRole() != RoomRole.OWNER) {
            throw new AccessDeniedException("Only the room owner can delete documents");
        }

        documentRepository.delete(document);
    }

    public Document assignDocumentToRoom(Long documentId, Long roomId, String email) {
        User user = getUser(email);
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        if (document.getRoom() == null) {
            throw new AccessDeniedException("Document is not currently assigned to a room");
        }

        RoomMembership currentMembership = getMembership(document, user.getId());
        requireApproved(currentMembership);

        if (currentMembership.getRole() != RoomRole.OWNER) {
            throw new AccessDeniedException("Only the current room owner can move a document");
        }

        Room targetRoom = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Target room not found"));

        if (!targetRoom.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only move documents into a room you own");
        }

        document.setRoom(targetRoom);
        return documentRepository.save(document);
    }

    public List<DocumentResponse> getDocumentsForRoom(Long roomId, String email) {
        User user = getUser(email);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));

        RoomMembership membership = roomMembershipRepository
                .findByRoomIdAndUserId(roomId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this room"));

        requireApproved(membership);

        return documentRepository.findByRoomId(roomId)
                .stream()
                .map(doc -> DocumentResponse.builder()
                        .id(doc.getId())
                        .name(doc.getName())
                        .content(doc.getContent())
                        .language(doc.getLanguage())
                        .roomId(doc.getRoom().getId())
                        .roomName(doc.getRoom().getName())
                        .baselineVersion(doc.getCrdtBaselineVersion())
                        .build())
                .toList();
    }

    private User getUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Document getDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));
    }

    private RoomMembership getMembership(Document document, Long userId) {
        if (document.getRoom() == null) {
            throw new AccessDeniedException("Document is not assigned to a room");
        }

        return roomMembershipRepository
                .findByRoomIdAndUserId(document.getRoom().getId(), userId)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this room"));
    }

    private void requireApproved(RoomMembership membership) {
        if (membership.getStatus() != MembershipStatus.APPROVED) {
            throw new AccessDeniedException("Your membership is not approved");
        }
    }
}