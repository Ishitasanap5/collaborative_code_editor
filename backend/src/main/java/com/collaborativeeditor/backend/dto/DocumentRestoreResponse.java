package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentRestoreResponse {

    private Long documentId;
    private Long snapshotId;
    private String content;
    private String restoredBy;
    private Long baselineVersion;
}