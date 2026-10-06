package com.collaborativeeditor.backend.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {
    private Long id;
    private String name;
    private String content;
    private String language;
    private Long roomId;
    private String roomName;
    private Long baselineVersion;
}