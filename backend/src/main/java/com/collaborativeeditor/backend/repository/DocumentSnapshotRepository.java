package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.DocumentSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DocumentSnapshotRepository
        extends JpaRepository<DocumentSnapshot, Long> {

    List<DocumentSnapshot> findByDocumentIdOrderByCreatedAtDesc(
            Long documentId
    );
}