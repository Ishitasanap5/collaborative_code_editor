package com.collaborativeeditor.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@NoArgsConstructor
@Table(name = "crdt_operations")
public class CRDTOperationEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long documentId;

    @Column(nullable = false, unique = true)
    private String operationId;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false)
    private String clientId;

    @Column(nullable = false)
    private String elementId;

    @Column
    private String value;

    @Column
    private String afterId;

    @Column(nullable = false)
    private Long clock;

    @Column(nullable = false)
    private boolean deleted;

    @Column(nullable = false)
    private Long baselineVersion;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {

        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}