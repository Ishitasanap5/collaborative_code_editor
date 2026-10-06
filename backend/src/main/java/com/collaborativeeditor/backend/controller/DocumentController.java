package com.collaborativeeditor.backend.controller;

import com.collaborativeeditor.backend.dto.CreateDocumentRequest;
import com.collaborativeeditor.backend.dto.DocumentResponse;
import com.collaborativeeditor.backend.dto.UpdateDocumentRequest;
import com.collaborativeeditor.backend.entity.Document;
import com.collaborativeeditor.backend.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/documents")
@CrossOrigin(origins = "http://localhost:5173")
public class DocumentController {

    private final DocumentService documentService;

    @PostMapping
    public ResponseEntity<Document> createDocument(
            @RequestBody CreateDocumentRequest request,
            Authentication authentication
    ) {
        Document document = documentService.createDocument(request, authentication.getName());
        return ResponseEntity.status(HttpStatus.CREATED).body(document);
    }

    @GetMapping("/{id}")
    public ResponseEntity<DocumentResponse> getDocument(
            @PathVariable Long id,
            Authentication authentication
    ) {
        DocumentResponse response = documentService.getDocumentForUser(id, authentication.getName());
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Document> updateDocument(
            @PathVariable Long id,
            @RequestBody UpdateDocumentRequest request,
            Authentication authentication
    ) {
        Document document = documentService.updateDocument(id, request, authentication.getName());
        return ResponseEntity.ok(document);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable Long id,
            Authentication authentication
    ) {
        documentService.deleteDocument(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{documentId}/room/{roomId}")
    public ResponseEntity<Document> assignDocumentToRoom(
            @PathVariable Long documentId,
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        Document document = documentService.assignDocumentToRoom(documentId, roomId, authentication.getName());
        return ResponseEntity.ok(document);
    }

    @GetMapping("/room/{roomId}")
    public ResponseEntity<List<DocumentResponse>> getDocumentsForRoom(
            @PathVariable Long roomId,
            Authentication authentication
    ) {
        List<DocumentResponse> documents = documentService.getDocumentsForRoom(roomId, authentication.getName());
        return ResponseEntity.ok(documents);
    }
}