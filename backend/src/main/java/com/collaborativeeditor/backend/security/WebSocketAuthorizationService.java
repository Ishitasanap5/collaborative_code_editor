package com.collaborativeeditor.backend.security;

import com.collaborativeeditor.backend.entity.Document;
import com.collaborativeeditor.backend.entity.MembershipStatus;
import com.collaborativeeditor.backend.entity.RoomMembership;
import com.collaborativeeditor.backend.entity.RoomRole;
import com.collaborativeeditor.backend.repository.DocumentRepository;
import com.collaborativeeditor.backend.repository.RoomMembershipRepository;
import com.collaborativeeditor.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WebSocketAuthorizationService {

    private final UserRepository userRepository;
    private final DocumentRepository documentRepository;
    private final RoomMembershipRepository roomMembershipRepository;

    public void requireDocumentAccess(Long documentId, String email) {
        var user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("User not found"));

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new AccessDeniedException("Document not found"));

        if (document.getRoom() == null) {
            throw new AccessDeniedException("Document is not assigned to a room");
        }

        RoomMembership membership = roomMembershipRepository
                .findByRoomIdAndUserId(document.getRoom().getId(), user.getId())
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this room"));

        if (membership.getStatus() != MembershipStatus.APPROVED) {
            throw new AccessDeniedException("Your membership is not approved");
        }
    }

    public void requireEditAccess(Long documentId, String email) {
        requireDocumentAccess(documentId, email); // Re-use general access checks

        var user = userRepository.findByEmail(email).get();
        Document document = documentRepository.findById(documentId).get();

        RoomMembership membership = roomMembershipRepository
                .findByRoomIdAndUserId(document.getRoom().getId(), user.getId())
                .get();

        if (membership.getRole() == RoomRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot edit this document");
        }
    }
}