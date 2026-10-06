package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.dto.CreateSnapshotRequest;
import com.collaborativeeditor.backend.dto.DocumentRestoreResponse;
import com.collaborativeeditor.backend.dto.SnapshotResponse;
import com.collaborativeeditor.backend.entity.*;
import com.collaborativeeditor.backend.repository.*;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DocumentSnapshotService {

    private final DocumentRepository documentRepository;
    private final DocumentSnapshotRepository snapshotRepository;
    private final UserRepository userRepository;
    private final RoomMembershipRepository roomMembershipRepository;
    private final CRDTOperationRepository crdtOperationRepository;
    private final CRDTBaselineService crdtBaselineService;

    public SnapshotResponse createSnapshot(Long documentId, CreateSnapshotRequest request, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        RoomMembership membership = getMembership(document, user.getId());

        if (membership.getRole() == RoomRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot create snapshots");
        }

        DocumentSnapshot snapshot = DocumentSnapshot.builder()
                .document(document)
                .content(request.getContent())
                .createdBy(user.getUsername())
                .operationCount(crdtOperationRepository.countByDocumentId(documentId))
                .build();

        DocumentSnapshot savedSnapshot = snapshotRepository.save(snapshot);
        return toResponse(savedSnapshot);
    }

    public List<SnapshotResponse> getSnapshots(Long documentId, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        getMembership(document, user.getId()); // Validates access

        return snapshotRepository.findByDocumentIdOrderByCreatedAtDesc(documentId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public DocumentRestoreResponse restoreSnapshot(Long documentId, Long snapshotId, String email) {
        User user = getUser(email);
        Document document = getDocument(documentId);
        RoomMembership membership = getMembership(document, user.getId());

        if (membership.getRole() == RoomRole.VIEWER) {
            throw new AccessDeniedException("Viewers cannot restore snapshots");
        }

        DocumentSnapshot snapshot = snapshotRepository.findById(snapshotId)
                .orElseThrow(() -> new RuntimeException("Snapshot not found"));

        if (!snapshot.getDocument().getId().equals(documentId)) {
            throw new AccessDeniedException("Snapshot does not belong to this document");
        }

        Document restoredDocument = crdtBaselineService.createBaseline(
                documentId,
                snapshot.getContent()
        );

        return DocumentRestoreResponse.builder()
                .documentId(documentId)
                .snapshotId(snapshot.getId())
                .content(restoredDocument.getContent())
                .baselineVersion(restoredDocument.getCrdtBaselineVersion())
                .restoredBy(user.getUsername())
                .build();
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

        RoomMembership membership = roomMembershipRepository
                .findByRoomIdAndUserId(document.getRoom().getId(), userId)
                .orElseThrow(() -> new AccessDeniedException("You do not have access to this room"));

        if (membership.getStatus() != MembershipStatus.APPROVED) {
            throw new AccessDeniedException("Your membership is not approved");
        }

        return membership;
    }

    private SnapshotResponse toResponse(DocumentSnapshot snapshot) {
        return SnapshotResponse.builder()
                .id(snapshot.getId())
                .documentId(snapshot.getDocument().getId())
                .content(snapshot.getContent())
                .createdBy(snapshot.getCreatedBy())
                .createdAt(snapshot.getCreatedAt())
                .operationCount(snapshot.getOperationCount()) // Fixed getter call
                .build();
    }
}