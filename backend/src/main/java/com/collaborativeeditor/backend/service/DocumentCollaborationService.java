package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.dto.DocumentRestoreMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentCollaborationService {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastRestore(
            Long documentId,
            Long snapshotId,
            String content,
            Long baselineVersion,
            String restoredBy
    ) {
        DocumentRestoreMessage message = DocumentRestoreMessage.builder()
                .type("RESTORE")
                .documentId(documentId)
                .snapshotId(snapshotId)
                .content(content)
                .baselineVersion(baselineVersion)
                .restoredBy(restoredBy)
                .build();

        String destination = "/topic/document/" + documentId;

        log.info("🔄 Broadcasting snapshot restore to: {} | Snapshot: {} | Restored by: {}",
                destination, snapshotId, restoredBy);

        messagingTemplate.convertAndSend(destination, message);
    }
}