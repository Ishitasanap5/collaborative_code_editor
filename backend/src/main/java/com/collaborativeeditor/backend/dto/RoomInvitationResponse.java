package com.collaborativeeditor.backend.dto;

import com.collaborativeeditor.backend.entity.RoomRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomInvitationResponse {

    private Long invitationId;
    private Long roomId;
    private String roomName;
    private String inviteCode;
    private Long invitedById;
    private String invitedByUsername;
    private String invitedByEmail;
    private RoomRole role;
    private String status;
    private LocalDateTime createdAt;
}