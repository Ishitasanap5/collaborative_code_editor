package com.collaborativeeditor.backend.controller;

import com.collaborativeeditor.backend.dto.CreateSnapshotRequest;
import com.collaborativeeditor.backend.dto.DocumentRestoreResponse;
import com.collaborativeeditor.backend.dto.SnapshotResponse;
import com.collaborativeeditor.backend.service.DocumentCollaborationService;
import com.collaborativeeditor.backend.service.DocumentSnapshotService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/documents/{documentId}/snapshots")
@RequiredArgsConstructor
public class DocumentSnapshotController {

    private final DocumentSnapshotService snapshotService;
    private final DocumentCollaborationService documentCollaborationService;

    @PostMapping
    public ResponseEntity<SnapshotResponse> createSnapshot(
            @PathVariable Long documentId,
            @RequestBody CreateSnapshotRequest request,
            Authentication authentication
    ) {
        SnapshotResponse response = snapshotService.createSnapshot(
                documentId,
                request,
                authentication.getName()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<SnapshotResponse>> getSnapshots(
            @PathVariable Long documentId,
            Authentication authentication
    ) {
        List<SnapshotResponse> snapshots = snapshotService.getSnapshots(
                documentId,
                authentication.getName()
        );
        return ResponseEntity.ok(snapshots);
    }

    @PostMapping("/{snapshotId}/restore")
    public ResponseEntity<DocumentRestoreResponse> restoreSnapshot(
            @PathVariable Long documentId,
            @PathVariable Long snapshotId,
            Authentication authentication
    ) {
        DocumentRestoreResponse response = snapshotService.restoreSnapshot(
                documentId,
                snapshotId,
                authentication.getName()
        );

        documentCollaborationService.broadcastRestore(
                response.getDocumentId(),
                response.getSnapshotId(),
                response.getContent(),
                response.getBaselineVersion(),
                response.getRestoredBy()
        );

        return ResponseEntity.ok(response);
    }
}