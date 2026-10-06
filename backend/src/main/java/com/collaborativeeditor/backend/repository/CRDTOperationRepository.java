package com.collaborativeeditor.backend.repository;

import com.collaborativeeditor.backend.entity.CRDTOperationEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CRDTOperationRepository
        extends JpaRepository<CRDTOperationEntity, Long> {

    List<CRDTOperationEntity>
    findByDocumentIdOrderByIdAsc(
            Long documentId
    );

    List<CRDTOperationEntity>
    findByDocumentIdAndBaselineVersionOrderByIdAsc(
            Long documentId,
            Long baselineVersion
    );

    boolean existsByOperationId(
            String operationId
    );

    long countByDocumentId(
            Long documentId
    );
}