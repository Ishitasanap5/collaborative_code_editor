package com.collaborativeeditor.backend.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateSnapshotRequest {
    private String content;
}