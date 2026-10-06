package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CRDTElement {

    private String id;
    private String value;
    private String afterId;
    private String clientId;
    private long clock;
    private boolean deleted;

    // Lombok already generates isDeleted().
}