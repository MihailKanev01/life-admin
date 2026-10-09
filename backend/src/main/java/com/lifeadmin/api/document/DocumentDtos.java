package com.lifeadmin.api.document;
import java.time.Instant;
import java.util.*;
import jakarta.validation.constraints.*;

public final class DocumentDtos {
    private DocumentDtos() {}
    public record UploadSessionRequest(
        @NotBlank @Size(max=255) String fileName,
        @NotBlank @Size(max=100) String contentType,
        @Positive @Max(10485760) long sizeBytes,
        @NotBlank @Pattern(regexp="^[A-Za-z0-9+/]{43}=$") String checksumSha256,
        UUID thingId) {}
    public record UploadSessionResponse(UUID documentId, String uploadUrl, Map<String,String> headers, Instant expiresAt) {}
    public record DocumentResponse(UUID id, String fileName, String contentType, long sizeBytes, String checksumSha256,
                                   UUID thingId, String thingName, Instant createdAt, String status, String extractionStatus) {}
    public record DocumentList(List<DocumentResponse> items) {}
    public record DownloadUrlResponse(String url, Instant expiresAt) {}
}
