package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.MembershipStatus;
import com.collaborativeeditor.backend.entity.RoomMembership;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomMembershipRepository
        extends JpaRepository<RoomMembership, Long> {

    List<RoomMembership> findByUserId(Long userId);

    List<RoomMembership> findByUserIdAndStatus(
            Long userId,
            MembershipStatus status
    );

    List<RoomMembership> findByRoomIdAndStatus(
            Long roomId,
            MembershipStatus status
    );

    Optional<RoomMembership> findByRoomIdAndUserId(
            Long roomId,
            Long userId
    );
}