package com.collaborativeeditor.backend.controller;

import com.collaborativeeditor.backend.dto.CreateRoomRequest;
import com.collaborativeeditor.backend.dto.InviteUserRequest;
import com.collaborativeeditor.backend.dto.JoinRoomByCodeRequest;
import com.collaborativeeditor.backend.dto.RoomMembershipResponse;
import com.collaborativeeditor.backend.dto.UpdateJoinRequest;
import com.collaborativeeditor.backend.entity.Room;
import com.collaborativeeditor.backend.service.RoomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;

    @PostMapping
    public ResponseEntity<Room> createRoom(
            @RequestBody CreateRoomRequest request,
            Authentication authentication
    ) {
        Room room = roomService.createRoom(request.getName(), authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping("/my")
    public ResponseEntity<List<RoomMembershipResponse>> getMyRooms(Authentication authentication) {
        List<RoomMembershipResponse> rooms = roomService.getMyRooms(authentication.getName());
        return ResponseEntity.ok(rooms);
    }

    @GetMapping("/my/requests")
    public ResponseEntity<List<RoomMembershipResponse>> getMyRequests(Authentication authentication) {
        List<RoomMembershipResponse> requests = roomService.getMyRequests(authentication.getName());
        return ResponseEntity.ok(requests);
    }

    @PostMapping("/join")
    public ResponseEntity<RoomMembershipResponse> joinRoom(
            @RequestBody JoinRoomByCodeRequest request,
            Authentication authentication
    ) {
        RoomMembershipResponse membership = roomService.requestToJoin(authentication.getName(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(membership);
    }

    @GetMapping("/{roomId}/requests")
    public ResponseEntity<List<RoomMembershipResponse>> getPendingRequests(
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        List<RoomMembershipResponse> requests = roomService.getPendingRequests(roomId, authentication.getName());
        return ResponseEntity.ok(requests);
    }

    @GetMapping("/invitations/my")
    public ResponseEntity<?> getMyInvitations(Authentication authentication) {
        return ResponseEntity.ok(roomService.getMyInvitations(authentication.getName()));
    }

    @PutMapping("/requests/{membershipId}")
    public ResponseEntity<RoomMembershipResponse> updateJoinRequest(
            @PathVariable Long membershipId,
            @RequestBody UpdateJoinRequest request,
            Authentication authentication
    ) {
        RoomMembershipResponse membership = roomService.updateJoinRequest(membershipId, authentication.getName(), request);
        return ResponseEntity.ok(membership);
    }

    @GetMapping("/{roomId}/members")
    public ResponseEntity<List<RoomMembershipResponse>> getMembers(
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        List<RoomMembershipResponse> members = roomService.getMembers(roomId, authentication.getName());
        return ResponseEntity.ok(members);
    }

    @DeleteMapping("/{roomId}/members/{userId}")
    public ResponseEntity<String> removeMember(
            @PathVariable Long roomId,
            @PathVariable Long userId,
            Authentication authentication
    ) {
        roomService.removeMember(roomId, userId, authentication.getName());
        return ResponseEntity.ok("Member removed successfully");
    }

    @PostMapping("/{roomId}/invitations")
    public ResponseEntity<String> inviteUser(
            @PathVariable Long roomId,
            @RequestBody InviteUserRequest request,
            Authentication authentication
    ) {
        roomService.inviteUser(roomId, authentication.getName(), request);
        return ResponseEntity.ok("Invitation sent successfully");
    }

    @PostMapping("/invitations/{invitationId}/accept")
    public ResponseEntity<String> acceptInvitation(
            @PathVariable Long invitationId,
            Authentication authentication
    ) {
        roomService.acceptInvitation(invitationId, authentication.getName());
        return ResponseEntity.ok("Invitation accepted");
    }

    @PostMapping("/invitations/{invitationId}/decline")
    public ResponseEntity<String> declineInvitation(
            @PathVariable Long invitationId,
            Authentication authentication
    ) {
        roomService.declineInvitation(invitationId, authentication.getName());
        return ResponseEntity.ok("Invitation declined");
    }
}