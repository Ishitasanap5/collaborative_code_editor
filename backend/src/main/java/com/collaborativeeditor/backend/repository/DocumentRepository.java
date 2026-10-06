package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.Document;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentRepository extends JpaRepository<Document, Long> {
    List<Document> findByRoomId(Long roomId);
}