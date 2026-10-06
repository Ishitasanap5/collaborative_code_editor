package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RoomRepository
        extends JpaRepository<Room, Long> {

    List<Room> findByOwnerId(Long ownerId);

    Optional<Room> findByInviteCode(String inviteCode);

    boolean existsByName(String name);
}