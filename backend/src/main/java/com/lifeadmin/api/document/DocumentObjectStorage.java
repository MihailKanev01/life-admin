package com.lifeadmin.api.document;
import java.time.Instant;
import java.util.Map;
public interface DocumentObjectStorage {
    UploadTarget presignUpload(String storageKey,String contentType,String checksumSha256);
    DownloadTarget presignDownload(String storageKey,String fileName,String contentType);
    ObjectMetadata headObject(String storageKey);
    byte[] readObject(String storageKey,int maximumBytes);
    void deleteObject(String storageKey);
    record UploadTarget(String url,Map<String,String> headers,Instant expiresAt) {}
    record DownloadTarget(String url,Instant expiresAt) {}
    record ObjectMetadata(long contentLength,String contentType) {}
}
