package com.collaborativeeditor.backend.config;

import com.collaborativeeditor.backend.dto.PresenceMessage;
import com.collaborativeeditor.backend.service.PresenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;

@Component
@RequiredArgsConstructor
public class WebSocketPresenceListener {

    private final PresenceService presenceService;
    private final SimpMessagingTemplate messagingTemplate;

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String clientId = null;

        if (accessor.getSessionAttributes() != null) {
            clientId = (String) accessor.getSessionAttributes().get("clientId");
        }

        System.out.println("🔌 WebSocket disconnected. clientId = " + clientId);

        if (clientId == null) {
            System.out.println("⚠️ Could not find clientId for disconnected session");
            return;
        }

        Long documentId = presenceService.getDocumentForUser(clientId);

        if (documentId == null) {
            System.out.println("⚠️ No document found for disconnected user: " + clientId);
            return;
        }

        presenceService.userDisconnected(clientId);
        Set<String> activeUsers = presenceService.getActiveUsers(documentId);

        PresenceMessage message = new PresenceMessage();
        message.setDocumentId(documentId);
        message.setClientId(clientId);
        message.setType("LEAVE");
        message.setActiveUsers(activeUsers);

        String destination = "/topic/document/" + documentId + "/presence";
        messagingTemplate.convertAndSend(destination, message);

        System.out.println("👥 Broadcast LEAVE | " + clientId + " | Active users: " + activeUsers);
    }
}