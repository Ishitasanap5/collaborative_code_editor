package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CRDTOperationMessage {

    private Long documentId;

    private CRDTOperation operation;
    private Long baselineVersion;

    public CRDTOperationMessage(
            Long documentId,
            CRDTOperation operation
    ) {
        this.documentId = documentId;
        this.operation = operation;
    }
}