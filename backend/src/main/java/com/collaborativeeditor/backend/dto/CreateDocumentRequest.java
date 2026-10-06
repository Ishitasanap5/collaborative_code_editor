package com.collaborativeeditor.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateDocumentRequest {
    private String name;
    private String language;
    private String content;
    private Long roomId;
}

