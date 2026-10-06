package com.collaborativeeditor.backend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SnapshotResponse {

    private Long id;
    private Long documentId;
    private String content;
    private String createdBy;
    private LocalDateTime createdAt;
    private Long operationCount;
}