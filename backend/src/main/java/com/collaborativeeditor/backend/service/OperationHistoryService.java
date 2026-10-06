package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.dto.CRDTElement;
import com.collaborativeeditor.backend.dto.CRDTOperation;
import com.collaborativeeditor.backend.dto.SyncResponse;
import com.collaborativeeditor.backend.entity.CRDTOperationEntity;
import com.collaborativeeditor.backend.entity.Document;
import com.collaborativeeditor.backend.repository.CRDTOperationRepository;
import com.collaborativeeditor.backend.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OperationHistoryService {

    private final CRDTOperationRepository repository;
    private final DocumentRepository documentRepository;

    public boolean addOperation(Long documentId, CRDTOperation operation) {
        return addOperation(documentId, operation, null);
    }

    public boolean addOperation(Long documentId, CRDTOperation operation, Long clientBaselineVersion) {
        if (documentId == null || operation == null || operation.getElement() == null) {
            log.warn("Invalid CRDT operation");
            return false;
        }

        CRDTElement element = operation.getElement();
        String type = operation.getType();

        boolean isInsert = "INSERT".equals(type);
        boolean isDelete = "DELETE".equals(type);

        if (!isInsert && !isDelete) {
            log.warn("Unknown CRDT operation type: {}", type);
            return false;
        }

        if (element.getId() == null || element.getId().isBlank()) {
            log.warn("CRDT operation without element id");
            return false;
        }

        if (isInsert && (element.getValue() == null || element.getValue().length() > 255)) {
            log.warn("INSERT with invalid value");
            return false;
        }

        String clientId = operation.getClientId() != null ? operation.getClientId() : element.getClientId();
        if (clientId == null) {
            log.warn("CRDT operation without clientId");
            return false;
        }

        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));

        long baselineVersion = baselineOf(document);

        if (clientBaselineVersion != null && clientBaselineVersion.longValue() != baselineVersion) {
            log.info("Rejected stale operation: client baseline={} current={}", clientBaselineVersion, baselineVersion);
            return false;
        }

        String elementId = element.getId();
        String operationId = type + ":" + elementId;

        if (repository.existsByOperationId(operationId)) {
            log.debug("Operation already exists: {}", operationId);
            return false;
        }

        CRDTOperationEntity entity = new CRDTOperationEntity();
        entity.setDocumentId(documentId);
        entity.setOperationId(operationId);
        entity.setType(type);
        entity.setClientId(clientId);
        entity.setElementId(elementId);
        entity.setValue(element.getValue());
        entity.setAfterId(element.getAfterId());
        entity.setClock(element.getClock());
        entity.setDeleted(isDelete);
        entity.setBaselineVersion(baselineVersion);

        try {
            repository.save(entity);
        } catch (DataIntegrityViolationException e) {
            log.debug("Duplicate operation (race): {}", operationId);
            return false;
        }

        return true;
    }

    @Transactional(readOnly = true)
    public SyncResponse getSyncState(Long documentId) {
        Document document = findDocument(documentId);
        long baselineVersion = baselineOf(document);

        List<CRDTOperation> operations = repository
                .findByDocumentIdAndBaselineVersionOrderByIdAsc(documentId, baselineVersion)
                .stream()
                .map(this::convertToDTO)
                .toList();

        String content = document.getContent() == null ? "" : document.getContent();

        return new SyncResponse(documentId, baselineVersion, content, operations);
    }

    @Transactional(readOnly = true)
    public List<CRDTOperation> getOperations(Long documentId) {
        Document document = findDocument(documentId);
        return repository
                .findByDocumentIdAndBaselineVersionOrderByIdAsc(documentId, baselineOf(document))
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    @Transactional
    public void clearDocument(Long documentId) {
        repository.deleteAll(repository.findByDocumentIdOrderByIdAsc(documentId));
        log.info("Cleared CRDT history for document {}", documentId);
    }

    private Document findDocument(Long documentId) {
        return documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found: " + documentId));
    }

    private long baselineOf(Document document) {
        Long version = document.getCrdtBaselineVersion();
        return version == null ? 0L : version;
    }

    private CRDTOperation convertToDTO(CRDTOperationEntity entity) {
        CRDTElement element = new CRDTElement();
        element.setId(entity.getElementId());
        element.setValue(entity.getValue());
        element.setAfterId(entity.getAfterId());
        element.setClientId(entity.getClientId());
        element.setClock(entity.getClock());
        element.setDeleted(entity.isDeleted());

        CRDTOperation operation = new CRDTOperation();
        operation.setType(entity.getType());
        operation.setClientId(entity.getClientId());
        operation.setElement(element);

        return operation;
    }
}