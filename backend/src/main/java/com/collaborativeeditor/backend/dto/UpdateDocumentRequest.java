package com.collaborativeeditor.backend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateDocumentRequest {
    private String name;
    private String language;
    private String content;

}
