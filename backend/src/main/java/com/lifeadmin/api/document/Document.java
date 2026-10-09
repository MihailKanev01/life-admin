package com.lifeadmin.api.document;
import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.*;

@Entity @Table(name = "documents")
public class Document {
    @Id @GeneratedValue private UUID id;
    @Column(name="user_id",nullable=false) private UUID userId;
    @Column(name="thing_id") private UUID thingId;
    @Column(name="storage_key",nullable=false,unique=true,length=512) private String storageKey;
    @Column(name="file_name",nullable=false,length=255) private String fileName;
    @Column(name="content_type",nullable=false,length=100) private String contentType;
    @Column(name="size_bytes",nullable=false) private long sizeBytes;
    @Column(name="checksum_sha256",nullable=false,length=44) private String checksumSha256;
    @Column(nullable=false,length=16) private String status;
    @Column(name="extraction_status",nullable=false,length=32) private String extractionStatus = "NOT_STARTED";
    @Column(name="created_at",nullable=false) private Instant createdAt;
    @Column(name="updated_at",nullable=false) private Instant updatedAt;
    protected Document() {}
    public Document(UUID userId, UUID thingId, String storageKey, String fileName, String contentType, long sizeBytes, String checksumSha256) {
        this.userId=userId; this.thingId=thingId; this.storageKey=storageKey; this.fileName=fileName; this.contentType=contentType;
        this.sizeBytes=sizeBytes; this.checksumSha256=checksumSha256; this.status="UPLOADING"; this.extractionStatus="NOT_STARTED";
    }
    @PrePersist void onCreate() { Instant now=Instant.now(); createdAt=now; updatedAt=now; }
    @PreUpdate void onUpdate() { updatedAt=Instant.now(); }
    public void markReady(String checksum) { this.checksumSha256=checksum; this.status="READY"; }
    public void markFailed() { this.status="FAILED"; }
    public boolean isReady() { return "READY".equals(status); }
    public UUID getId(){return id;} public UUID getUserId(){return userId;} public UUID getThingId(){return thingId;}
    public String getStorageKey(){return storageKey;} public String getFileName(){return fileName;} public String getContentType(){return contentType;}
    public long getSizeBytes(){return sizeBytes;} public String getChecksumSha256(){return checksumSha256;} public String getStatus(){return status;}
    public String getExtractionStatus(){return extractionStatus;} public Instant getCreatedAt(){return createdAt;} public Instant getUpdatedAt(){return updatedAt;}
}
