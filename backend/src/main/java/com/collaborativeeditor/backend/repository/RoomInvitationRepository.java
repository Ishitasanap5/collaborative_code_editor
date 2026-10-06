package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.RoomInvitation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RoomInvitationRepository
        extends JpaRepository<RoomInvitation, Long> {

    List<RoomInvitation> findByInvitedUserIdAndStatusOrderByCreatedAtDesc(
            Long userId,
            String status
    );
}