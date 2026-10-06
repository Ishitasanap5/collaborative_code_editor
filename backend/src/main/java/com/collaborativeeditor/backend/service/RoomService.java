package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.dto.*;
import com.collaborativeeditor.backend.entity.*;
import com.collaborativeeditor.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomMembershipRepository roomMembershipRepository;
    private final RoomInvitationRepository roomInvitationRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Transactional
    public Room createRoom(String name, String ownerEmail) {
        if (name == null || name.isBlank()) {
            throw new RuntimeException("Room name is required");
        }

        String trimmedName = name.trim();
        if (roomRepository.existsByName(trimmedName)) {
            throw new RuntimeException("A room with this name already exists");
        }

        User owner = getUserByEmail(ownerEmail);
        String inviteCode = generateInviteCode();

        Room room = Room.builder()
                .name(trimmedName)
                .inviteCode(inviteCode)
                .owner(owner)
                .createdAt(LocalDateTime.now())
                .build();

        room = roomRepository.save(room);

        RoomMembership ownerMembership = RoomMembership.builder()
                .room(room)
                .user(owner)
                .role(RoomRole.OWNER)
                .requestedRole(RoomRole.OWNER)
                .status(MembershipStatus.APPROVED)
                .createdAt(LocalDateTime.now())
                .build();

        roomMembershipRepository.save(ownerMembership);
        return room;
    }

    @Transactional(readOnly = true)
    public List<RoomMembershipResponse> getMyRooms(String email) {
        User user = getUserByEmail(email);
        List<RoomMembership> memberships = roomMembershipRepository.findByUserIdAndStatus(
                user.getId(),
                MembershipStatus.APPROVED
        );

        return memberships.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RoomMembershipResponse> getMyRequests(String email) {
        User user = getUserByEmail(email);
        return roomMembershipRepository.findByUserId(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RoomMembershipResponse requestToJoin(String email, JoinRoomByCodeRequest request) {
        if (request == null || request.getInviteCode() == null || request.getInviteCode().isBlank()) {
            throw new RuntimeException("Invite code is required");
        }

        RoomRole requestedRole = request.getRequestedRole();
        if (requestedRole == null || requestedRole == RoomRole.OWNER) {
            throw new RuntimeException("Please choose MEMBER or VIEWER");
        }

        User user = getUserByEmail(email);
        String inviteCode = request.getInviteCode().trim().toUpperCase();

        Room room = roomRepository.findByInviteCode(inviteCode)
                .orElseThrow(() -> new RuntimeException("Invalid room invite code"));

        var existing = roomMembershipRepository.findByRoomIdAndUserId(room.getId(), user.getId());

        if (existing.isPresent()) {
            RoomMembership membership = existing.get();

            if (membership.getStatus() == MembershipStatus.APPROVED) {
                throw new RuntimeException("You are already a member of this room");
            }
            if (membership.getStatus() == MembershipStatus.PENDING) {
                throw new RuntimeException("Your join request is already pending");
            }
            if (membership.getStatus() == MembershipStatus.REJECTED) {
                membership.setRequestedRole(requestedRole);
                membership.setRole(requestedRole);
                membership.setStatus(MembershipStatus.PENDING);
                RoomMembership updated = roomMembershipRepository.save(membership);

                notificationService.create(
                        room.getOwner(),
                        "JOIN_REQUEST",
                        "New join request",
                        user.getUsername() + " requested to join \"" + room.getName() + "\" as " + requestedRole + ".",
                        room.getId()
                );

                return toResponse(updated);
            }
        }

        RoomMembership membership = RoomMembership.builder()
                .room(room)
                .user(user)
                .role(requestedRole)
                .requestedRole(requestedRole)
                .status(MembershipStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        membership = roomMembershipRepository.save(membership);

        notificationService.create(
                room.getOwner(),
                "JOIN_REQUEST",
                "New join request",
                user.getUsername() + " requested to join \"" + room.getName() + "\" as " + requestedRole + ".",
                room.getId()
        );

        return toResponse(membership);
    }

    @Transactional(readOnly = true)
    public List<RoomMembershipResponse> getPendingRequests(Long roomId, String ownerEmail) {
        Room room = getRoom(roomId);
        verifyOwner(room, ownerEmail);

        return roomMembershipRepository.findByRoomIdAndStatus(roomId, MembershipStatus.PENDING)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RoomMembershipResponse updateJoinRequest(Long membershipId, String ownerEmail, UpdateJoinRequest request) {
        if (request == null) {
            throw new RuntimeException("Request data is required");
        }

        RoomMembership membership = roomMembershipRepository.findById(membershipId)
                .orElseThrow(() -> new RuntimeException("Join request not found"));

        Room room = membership.getRoom();
        verifyOwner(room, ownerEmail);

        if (membership.getStatus() != MembershipStatus.PENDING) {
            throw new RuntimeException("This request has already been processed");
        }

        User requestingUser = membership.getUser();

        if (!request.isApprove()) {
            membership.setStatus(MembershipStatus.REJECTED);
            membership = roomMembershipRepository.save(membership);

            notificationService.create(
                    requestingUser,
                    "JOIN_REQUEST_REJECTED",
                    "Join request rejected",
                    "Your request to join \"" + room.getName() + "\" was rejected.",
                    room.getId()
            );

            return toResponse(membership);
        }

        RoomRole approvedRole = request.getRole();
        if (approvedRole == null || approvedRole == RoomRole.OWNER) {
            throw new RuntimeException("Approved role must be MEMBER or VIEWER");
        }

        membership.setRole(approvedRole);
        membership.setStatus(MembershipStatus.APPROVED);
        membership = roomMembershipRepository.save(membership);

        notificationService.create(
                requestingUser,
                "JOIN_REQUEST_APPROVED",
                "Join request approved",
                "Your request to join \"" + room.getName() + "\" was approved as " + approvedRole + ".",
                room.getId()
        );

        return toResponse(membership);
    }

    @Transactional(readOnly = true)
    public List<RoomMembershipResponse> getMembers(Long roomId, String email) {
        getRoom(roomId);
        verifyApprovedMember(roomId, email);

        return roomMembershipRepository.findByRoomIdAndStatus(roomId, MembershipStatus.APPROVED)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public void removeMember(Long roomId, Long userId, String ownerEmail) {
        Room room = getRoom(roomId);
        verifyOwner(room, ownerEmail);

        RoomMembership membership = roomMembershipRepository.findByRoomIdAndUserId(roomId, userId)
                .orElseThrow(() -> new RuntimeException("Member not found"));

        if (membership.getRole() == RoomRole.OWNER) {
            throw new RuntimeException("The room owner cannot be removed");
        }

        notificationService.create(
                membership.getUser(),
                "USER_REMOVED",
                "Removed from room",
                "You were removed from \"" + room.getName() + "\".",
                room.getId()
        );

        roomMembershipRepository.delete(membership);
    }

    @Transactional
    public void inviteUser(Long roomId, String ownerEmail, InviteUserRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            throw new RuntimeException("User email is required");
        }

        Room room = getRoom(roomId);
        User owner = verifyOwner(room, ownerEmail);

        RoomRole role = request.getRole();
        if (role == null || role == RoomRole.OWNER) {
            throw new RuntimeException("Invitation role must be MEMBER or VIEWER");
        }

        User invitedUser = userRepository.findByEmail(request.getEmail().trim())
                .orElseThrow(() -> new RuntimeException("No user exists with this email"));

        if (invitedUser.getId().equals(owner.getId())) {
            throw new RuntimeException("You cannot invite yourself");
        }

        var existingMembership = roomMembershipRepository.findByRoomIdAndUserId(roomId, invitedUser.getId());
        if (existingMembership.isPresent()) {
            RoomMembership membership = existingMembership.get();
            if (membership.getStatus() == MembershipStatus.APPROVED) {
                throw new RuntimeException("User is already a member of this room");
            }
            if (membership.getStatus() == MembershipStatus.PENDING) {
                throw new RuntimeException("User already has a pending join request");
            }
        }

        RoomInvitation invitation = RoomInvitation.builder()
                .room(room)
                .invitedUser(invitedUser)
                .invitedBy(owner)
                .role(role)
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        roomInvitationRepository.save(invitation);

        notificationService.create(
                invitedUser,
                "ROOM_INVITATION",
                "New room invitation",
                owner.getUsername() + " invited you to \"" + room.getName() + "\" as " + role + ".",
                room.getId()
        );
    }

    @Transactional
    public void acceptInvitation(Long invitationId, String userEmail) {
        RoomInvitation invitation = roomInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        User user = getUserByEmail(userEmail);

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This invitation does not belong to you");
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new RuntimeException("Invitation has already been processed");
        }

        Room room = invitation.getRoom();
        var existingMembership = roomMembershipRepository.findByRoomIdAndUserId(room.getId(), user.getId());

        if (existingMembership.isPresent()) {
            RoomMembership membership = existingMembership.get();
            membership.setRole(invitation.getRole());
            membership.setRequestedRole(invitation.getRole());
            membership.setStatus(MembershipStatus.APPROVED);
            roomMembershipRepository.save(membership);
        } else {
            RoomMembership membership = RoomMembership.builder()
                    .room(room)
                    .user(user)
                    .role(invitation.getRole())
                    .requestedRole(invitation.getRole())
                    .status(MembershipStatus.APPROVED)
                    .createdAt(LocalDateTime.now())
                    .build();
            roomMembershipRepository.save(membership);
        }

        invitation.setStatus("ACCEPTED");
        roomInvitationRepository.save(invitation);

        notificationService.create(
                room.getOwner(),
                "INVITATION_ACCEPTED",
                "Invitation accepted",
                user.getUsername() + " accepted your invitation to \"" + room.getName() + "\".",
                room.getId()
        );
    }

    @Transactional
    public void declineInvitation(Long invitationId, String userEmail) {
        RoomInvitation invitation = roomInvitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        User user = getUserByEmail(userEmail);

        if (!invitation.getInvitedUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("This invitation does not belong to you");
        }

        if (!"PENDING".equals(invitation.getStatus())) {
            throw new RuntimeException("Invitation has already been processed");
        }

        invitation.setStatus("DECLINED");
        roomInvitationRepository.save(invitation);

        notificationService.create(
                invitation.getInvitedBy(),
                "INVITATION_DECLINED",
                "Invitation declined",
                user.getUsername() + " declined your invitation to \"" + invitation.getRoom().getName() + "\".",
                invitation.getRoom().getId()
        );
    }

    @Transactional(readOnly = true)
    public List<RoomInvitationResponse> getMyInvitations(String email) {
        User user = getUserByEmail(email);
        return roomInvitationRepository.findByInvitedUserIdAndStatusOrderByCreatedAtDesc(user.getId(), "PENDING")
                .stream()
                .map(this::toInvitationResponse)
                .toList();
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private Room getRoom(Long roomId) {
        return roomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Room not found"));
    }

    private User verifyOwner(Room room, String email) {
        if (room.getOwner() == null || !room.getOwner().getEmail().equals(email)) {
            throw new AccessDeniedException("Only the room owner can perform this action");
        }
        return room.getOwner();
    }

    private RoomMembership verifyApprovedMember(Long roomId, String email) {
        User user = getUserByEmail(email);
        RoomMembership membership = roomMembershipRepository.findByRoomIdAndUserId(roomId, user.getId())
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this room"));

        if (membership.getStatus() != MembershipStatus.APPROVED) {
            throw new AccessDeniedException("Your membership is not approved");
        }

        return membership;
    }

    private String generateInviteCode() {
        String code;
        do {
            code = "SYNC-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (roomRepository.findByInviteCode(code).isPresent());
        return code;
    }

    private RoomMembershipResponse toResponse(RoomMembership membership) {
        Room room = membership.getRoom();
        User user = membership.getUser();

        return RoomMembershipResponse.builder()
                .membershipId(membership.getId())
                .roomId(room.getId())
                .roomName(room.getName())
                .inviteCode(room.getInviteCode())
                .userId(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(membership.getRole())
                .requestedRole(membership.getRequestedRole())
                .status(membership.getStatus())
                .createdAt(membership.getCreatedAt())
                .build();
    }

    private RoomInvitationResponse toInvitationResponse(RoomInvitation invitation) {
        Room room = invitation.getRoom();
        User invitedBy = invitation.getInvitedBy();

        return RoomInvitationResponse.builder()
                .invitationId(invitation.getId())
                .roomId(room.getId())
                .roomName(room.getName())
                .inviteCode(room.getInviteCode())
                .invitedById(invitedBy.getId())
                .invitedByUsername(invitedBy.getUsername())
                .invitedByEmail(invitedBy.getEmail())
                .role(invitation.getRole())
                .status(invitation.getStatus())
                .createdAt(invitation.getCreatedAt())
                .build();
    }
}