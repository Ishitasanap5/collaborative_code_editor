package com.collaborativeeditor.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final Map<Long, Set<String>> activeUsers = new HashMap<>();
    private final Map<String, Long> userDocuments = new HashMap<>();

    public synchronized void userJoined(Long documentId, String clientId) {
        activeUsers.computeIfAbsent(documentId, id -> new HashSet<>()).add(clientId);
        userDocuments.put(clientId, documentId);
        log.info("🟢 User joined document {}: {}", documentId, clientId);
    }

    public synchronized void userLeft(Long documentId, String clientId) {
        Set<String> users = activeUsers.get(documentId);
        if (users == null) {
            return;
        }

        users.remove(clientId);
        userDocuments.remove(clientId);

        if (users.isEmpty()) {
            activeUsers.remove(documentId);
        }

        log.info("🔴 User left document {}: {}", documentId, clientId);
    }

    public synchronized void userDisconnected(String clientId) {
        Long documentId = userDocuments.get(clientId);
        if (documentId == null) {
            return;
        }

        userLeft(documentId, clientId);
        log.info("🔌 User disconnected: {}", clientId);
    }

    public synchronized Long getDocumentForUser(String clientId) {
        return userDocuments.get(clientId);
    }

    public synchronized Set<String> getActiveUsers(Long documentId) {
        return new HashSet<>(activeUsers.getOrDefault(documentId, Collections.emptySet()));
    }
}