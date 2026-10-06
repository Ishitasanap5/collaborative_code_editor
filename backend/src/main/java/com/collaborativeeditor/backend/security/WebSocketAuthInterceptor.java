package com.collaborativeeditor.backend.security;

import com.collaborativeeditor.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final WebSocketAuthorizationService webSocketAuthorizationService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        // CONNECT
        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            String authorization = accessor.getFirstNativeHeader("Authorization");

            if (authorization == null || !authorization.startsWith("Bearer ")) {
                throw new IllegalArgumentException("Missing WebSocket authentication token");
            }

            String token = authorization.substring(7);

            if (!jwtService.isTokenValid(token)) {
                throw new IllegalArgumentException("Invalid or expired WebSocket token");
            }

            String email = jwtService.extractEmail(token);

            Authentication authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            List.of(new SimpleGrantedAuthority("ROLE_USER"))
                    );

            accessor.setUser(authentication);

            String clientId = accessor.getFirstNativeHeader("clientId");
            log.info("🔐 WebSocket CONNECT clientId = {}", clientId);

            if (clientId != null && accessor.getSessionAttributes() != null) {
                accessor.getSessionAttributes().put("clientId", clientId);
            }
        }

        // SUBSCRIBE
        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();

            if (destination != null && destination.startsWith("/topic/document/")) {
                String remaining = destination.substring("/topic/document/".length());
                String documentIdText = remaining.split("/")[0];

                try {
                    Long documentId = Long.parseLong(documentIdText);

                    if (!(accessor.getUser() instanceof Authentication authentication)) {
                        throw new IllegalArgumentException("Unauthenticated WebSocket session");
                    }

                    String email = authentication.getName();
                    webSocketAuthorizationService.requireDocumentAccess(documentId, email);

                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid document ID");
                }
            }
        }

        // SEND
        if (StompCommand.SEND.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();

            if (destination != null && destination.startsWith("/app/")) {
                if (!(accessor.getUser() instanceof Authentication)) {
                    throw new IllegalArgumentException("Authentication required");
                }
            }
        }

        return message;
    }
}