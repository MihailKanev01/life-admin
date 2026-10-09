package com.lifeadmin.api.document;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.*;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.*;

@Component @Profile("!test")
public class S3DocumentObjectStorage implements DocumentObjectStorage {
    private static final Duration TTL=Duration.ofMinutes(10);
    private final S3Client s3; private final S3Presigner presigner; private final String bucket;
    public S3DocumentObjectStorage(S3Client s3,S3Presigner presigner,
            @Value("${life-admin.storage.s3.bucket:}") String bucket) {
        this.s3=s3; this.presigner=presigner;
        this.bucket=bucket==null?"":bucket.trim();
    }
    @Override public UploadTarget presignUpload(String key,String type,String checksumSha256) {
        requireConfigured();
        PutObjectRequest put=PutObjectRequest.builder().bucket(bucket).key(key).contentType(type)
                .checksumSHA256(checksumSha256).serverSideEncryption(ServerSideEncryption.AES256).build();
        PresignedPutObjectRequest signed=presigner.presignPutObject(PutObjectPresignRequest.builder()
                .signatureDuration(TTL).putObjectRequest(put).build());
        return new UploadTarget(signed.url().toString(),Map.of(
                "Content-Type",type,"x-amz-checksum-sha256",checksumSha256,
                "x-amz-server-side-encryption","AES256"),Instant.now().plus(TTL));
    }
    @Override public DownloadTarget presignDownload(String key,String name,String type) {
        requireConfigured();
        String disposition=ContentDisposition.attachment().filename(name,StandardCharsets.UTF_8).build().toString();
        GetObjectRequest get=GetObjectRequest.builder().bucket(bucket).key(key)
                .responseContentDisposition(disposition).responseContentType(type).build();
        var signed=presigner.presignGetObject(GetObjectPresignRequest.builder()
                .signatureDuration(TTL).getObjectRequest(get).build());
        return new DownloadTarget(signed.url().toString(),Instant.now().plus(TTL));
    }
    @Override public ObjectMetadata headObject(String key) {
        requireConfigured();
        try {
            var head=s3.headObject(HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return new ObjectMetadata(head.contentLength()==null?-1L:head.contentLength(),head.contentType());
        } catch(S3Exception e) {if(e.statusCode()==404)return null;throw e;}
    }
    @Override public byte[] readObject(String key,int maximumBytes) {
        requireConfigured();
        try(ResponseInputStream<?> input=s3.getObject(GetObjectRequest.builder().bucket(bucket).key(key).build())) {
            return input.readNBytes(maximumBytes+1);
        } catch(IOException e) {throw new IllegalStateException("Could not read document from object storage.",e);}
    }
    @Override public void deleteObject(String key) {
        requireConfigured();
        s3.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
    private void requireConfigured() {
        if(bucket.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "Document storage is not configured.");
        }
    }
}
