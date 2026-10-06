package com.collaborativeeditor.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PresenceMessage {

    private Long documentId;
    private String clientId;
    private String type;
    private Set<String> activeUsers;
}