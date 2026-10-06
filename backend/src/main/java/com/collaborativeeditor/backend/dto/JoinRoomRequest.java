package com.collaborativeeditor.backend.dto;

import com.collaborativeeditor.backend.entity.RoomRole;
import lombok.Data;

@Data
public class JoinRoomRequest {

    private RoomRole requestedRole;
}