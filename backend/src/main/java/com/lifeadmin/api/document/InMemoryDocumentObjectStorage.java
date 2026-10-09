package com.lifeadmin.api.document;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.*;
import java.util.*;
import java.util.concurrent.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

@Component @Profile("test")
public class InMemoryDocumentObjectStorage implements DocumentObjectStorage {
    private static final Duration TTL=Duration.ofMinutes(10);
    private final ConcurrentMap<String,UploadTicket> uploads=new ConcurrentHashMap<>();
    private final ConcurrentMap<String,DownloadTicket> downloads=new ConcurrentHashMap<>();
    private final ConcurrentMap<String,StoredBytes> objects=new ConcurrentHashMap<>();
    @Override public UploadTarget presignUpload(String key,String type,String checksum) {
        String token=token();Instant expiry=Instant.now().plus(TTL);uploads.put(token,new UploadTicket(key,type,checksum,expiry));
        return new UploadTarget("/api/v1/documents/test-storage/"+encodeKey(key)+"?token="+token,
                Map.of("Content-Type",type,"x-amz-checksum-sha256",checksum),expiry);
    }
    @Override public DownloadTarget presignDownload(String key,String name,String type) {
        String token=token();Instant expiry=Instant.now().plus(TTL);downloads.put(token,new DownloadTicket(key,expiry));
        return new DownloadTarget("/api/v1/documents/test-storage/"+encodeKey(key)+"/download?token="+token,expiry);
    }
    @Override public ObjectMetadata headObject(String key) {
        StoredBytes stored=objects.get(key);return stored==null?null:new ObjectMetadata(stored.bytes().length,stored.contentType());
    }
    @Override public byte[] readObject(String key,int max) {
        StoredBytes stored=objects.get(key);return stored==null?null:Arrays.copyOf(stored.bytes(),Math.min(stored.bytes().length,max+1));
    }
    @Override public void deleteObject(String key) {
        objects.remove(key);uploads.entrySet().removeIf(e->e.getValue().key().equals(key));downloads.entrySet().removeIf(e->e.getValue().key().equals(key));
    }
    public String decodeKey(String encoded) {
        try{return new String(Base64.getUrlDecoder().decode(encoded),StandardCharsets.UTF_8);}
        catch(IllegalArgumentException e){throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Upload target not found");}
    }
    public void acceptUpload(String key,String token,String contentType,String checksum,byte[] content) {
        UploadTicket ticket=uploads.remove(token);
        if(ticket==null||!ticket.key().equals(key)||ticket.expiresAt().isBefore(Instant.now())
                ||!ticket.contentType().equalsIgnoreCase(contentType)||!ticket.checksum().equals(checksum))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Upload target is invalid or has expired");
        if(!sha256(content).equals(checksum))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Upload checksum did not match");
        objects.put(key,new StoredBytes(contentType,Arrays.copyOf(content,content.length)));
    }
    public byte[] readForDownload(String key,String token) {
        DownloadTicket ticket=downloads.remove(token);
        if(ticket==null||!ticket.key().equals(key)||ticket.expiresAt().isBefore(Instant.now()))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"Download URL is invalid or has expired");
        StoredBytes stored=objects.get(key);
        if(stored==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Document not found");
        return Arrays.copyOf(stored.bytes(),stored.bytes().length);
    }
    private static String encodeKey(String key){return Base64.getUrlEncoder().withoutPadding().encodeToString(key.getBytes(StandardCharsets.UTF_8));}
    private static String token(){return UUID.randomUUID().toString().replace("-","");}
    private static String sha256(byte[] bytes) {
        try{return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes));}
        catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 is not available.",e);}
    }
    private record UploadTicket(String key,String contentType,String checksum,Instant expiresAt){}
    private record DownloadTicket(String key,Instant expiresAt){}
    private record StoredBytes(String contentType,byte[] bytes){}
}
