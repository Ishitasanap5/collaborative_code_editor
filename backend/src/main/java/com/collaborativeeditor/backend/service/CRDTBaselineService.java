package com.collaborativeeditor.backend.service;

import com.collaborativeeditor.backend.entity.Document;
import com.collaborativeeditor.backend.repository.DocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CRDTBaselineService {

    private final DocumentRepository documentRepository;

    @Transactional
    public Document createBaseline(Long documentId, String content) {
        Document document = documentRepository.findById(documentId)
                .orElseThrow(() -> new RuntimeException("Document not found"));

        Long currentVersion = document.getCrdtBaselineVersion();
        if (currentVersion == null) {
            currentVersion = 0L;
        }

        document.setContent(content == null ? "" : content);
        document.setCrdtBaselineVersion(currentVersion + 1);

        return documentRepository.save(document);
    }
}