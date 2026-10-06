package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRestoreMessage {

    private String type;
    private Long documentId;
    private Long snapshotId;
    private String content;
    private Long baselineVersion;
    private String restoredBy;
}