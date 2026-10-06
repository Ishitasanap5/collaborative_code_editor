package com.collaborativeeditor.backend.controller;

import com.collaborativeeditor.backend.dto.CRDTOperation;
import com.collaborativeeditor.backend.dto.CRDTOperationMessage;
import com.collaborativeeditor.backend.dto.PresenceMessage;
import com.collaborativeeditor.backend.dto.SyncRequest;
import com.collaborativeeditor.backend.dto.SyncResponse;
import com.collaborativeeditor.backend.security.WebSocketAuthorizationService;
import com.collaborativeeditor.backend.service.OperationHistoryService;
import com.collaborativeeditor.backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.Set;

@Slf4j
@Controller
@RequiredArgsConstructor
public class CollaborationController {

    private final SimpMessagingTemplate messagingTemplate;
    private final OperationHistoryService operationHistoryService;
    private final PresenceService presenceService;
    private final WebSocketAuthorizationService webSocketAuthorizationService;

    // CRDT OPERATIONS
    @MessageMapping("/document")
    public void handleOperation(@Payload CRDTOperationMessage message, Principal principal) {
        if (principal == null || message == null) {
            log.warn("Unauthenticated or empty operation message");
            return;
        }

        Long documentId = message.getDocumentId();
        CRDTOperation operation = message.getOperation();

        if (documentId == null || operation == null) {
            log.warn("Invalid CRDT operation message");
            return;
        }

        String email = principal.getName();

        try {
            webSocketAuthorizationService.requireEditAccess(documentId, email);
        } catch (AccessDeniedException e) {
            log.warn("WebSocket edit denied for {}: {}", email, e.getMessage());
            return;
        }

        boolean persisted;
        try {
            persisted = operationHistoryService.addOperation(
                    documentId,
                    operation,
                    message.getBaselineVersion()
            );
        } catch (Exception e) {
            log.error("Failed to persist CRDT operation", e);
            return;
        }

        // Invalid, stale, or duplicate operations are not re-broadcast.
        if (!persisted) {
            return;
        }

        messagingTemplate.convertAndSend("/topic/document/" + documentId, message);
    }

    // CRDT SYNCHRONIZATION
    @MessageMapping("/document/sync")
    public void synchronizeDocument(@Payload SyncRequest request, Principal principal) {
        if (principal == null || request == null) {
            return;
        }

        Long documentId = request.getDocumentId();
        String clientId = request.getClientId();

        if (documentId == null || clientId == null) {
            log.warn("Invalid synchronization request");
            return;
        }

        String email = principal.getName();

        try {
            webSocketAuthorizationService.requireDocumentAccess(documentId, email);
        } catch (AccessDeniedException e) {
            log.warn("WebSocket sync denied for {}: {}", email, e.getMessage());
            return;
        }

        SyncResponse response;
        try {
            response = operationHistoryService.getSyncState(documentId);
        } catch (Exception e) {
            log.error("Failed to build sync state", e);
            return;
        }

        log.debug("Sending {} operations to {}", response.getOperations().size(), clientId);

        messagingTemplate.convertAndSend(
                "/topic/document/" + documentId + "/sync/" + clientId,
                response
        );
    }

    // PRESENCE
    @MessageMapping("/presence")
    public void handlePresence(@Payload PresenceMessage message, Principal principal) {
        if (principal == null || message == null) {
            return;
        }

        Long documentId = message.getDocumentId();
        String clientId = message.getClientId();
        String type = message.getType();

        if (documentId == null || clientId == null || type == null) {
            log.warn("Invalid presence message");
            return;
        }

        if ("JOIN".equals(type)) {
            try {
                webSocketAuthorizationService.requireDocumentAccess(documentId, principal.getName());
            } catch (AccessDeniedException e) {
                log.warn("WebSocket presence denied for {}: {}", principal.getName(), e.getMessage());
                return;
            }
            presenceService.userJoined(documentId, clientId);
        } else if ("LEAVE".equals(type)) {
            // Leaving never needs access validation to ensure disconnected users clean up properly (no ghost users).
            presenceService.userLeft(documentId, clientId);
        } else {
            log.warn("Unknown presence type: {}", type);
            return;
        }

        Set<String> activeUsers = presenceService.getActiveUsers(documentId);

        PresenceMessage broadcast = new PresenceMessage();
        broadcast.setDocumentId(documentId);
        broadcast.setClientId(clientId);
        broadcast.setType(type);
        broadcast.setActiveUsers(activeUsers);

        messagingTemplate.convertAndSend("/topic/document/" + documentId + "/presence", broadcast);
    }
}