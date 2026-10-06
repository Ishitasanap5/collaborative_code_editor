package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SyncResponse {

    private Long documentId;
    private Long baselineVersion;
    private String content;
    private List<CRDTOperation> operations;
}