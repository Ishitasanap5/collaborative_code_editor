package com.collaborativeeditor.backend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CRDTOperation {

    private String type;
    private CRDTElement element;
    private String clientId;
}