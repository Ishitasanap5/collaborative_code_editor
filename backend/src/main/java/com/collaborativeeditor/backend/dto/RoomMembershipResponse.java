package com.collaborativeeditor.backend.dto;

import com.collaborativeeditor.backend.entity.MembershipStatus;
import com.collaborativeeditor.backend.entity.RoomRole;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoomMembershipResponse {

    private Long membershipId;
    private Long roomId;
    private String roomName;
    private String inviteCode;
    private Long userId;
    private String username;
    private String email;
    private RoomRole role;
    private RoomRole requestedRole;
    private MembershipStatus status;
    private LocalDateTime createdAt;
}