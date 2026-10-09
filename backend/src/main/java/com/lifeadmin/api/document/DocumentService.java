package com.lifeadmin.api.document;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.Thing;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DocumentService {
    public static final long MAX_FILE_BYTES=10L*1024*1024;
    private final DocumentRepository documents; private final ThingRepository things; private final DocumentObjectStorage storage;
    public DocumentService(DocumentRepository documents,ThingRepository things,DocumentObjectStorage storage) {
        this.documents=documents;this.things=things;this.storage=storage;
    }
    @Transactional
    public DocumentDtos.UploadSessionResponse createUploadSession(UserPrincipal principal,DocumentDtos.UploadSessionRequest request) {
        String fileName=sanitizeFileName(request.fileName());
        if(request.sizeBytes()<=0||request.sizeBytes()>MAX_FILE_BYTES)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"File must be smaller than or equal to 10 MiB.");
        if(!isAllowedType(fileName,request.contentType()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Only PDF, JPEG and PNG documents are supported.");
        if(request.checksumSha256()==null||!request.checksumSha256().matches("^[A-Za-z0-9+/]{43}=$"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A valid SHA-256 checksum is required.");
        UUID thingId=request.thingId();
        if(thingId!=null&&things.findByIdAndUserIdAndArchivedFalse(thingId,principal.getId()).isEmpty())
            throw new ResponseStatusException(HttpStatus.NOT_FOUND,"Thing not found");
        String key="users/"+principal.getId()+"/documents/"+UUID.randomUUID();
        DocumentObjectStorage.UploadTarget target=storage.presignUpload(key,request.contentType(),request.checksumSha256());
        Document document=documents.save(new Document(principal.getId(),thingId,key,fileName,request.contentType(),request.sizeBytes(),request.checksumSha256()));
        return new DocumentDtos.UploadSessionResponse(document.getId(),target.url(),target.headers(),target.expiresAt());
    }
    @Transactional(noRollbackFor=ResponseStatusException.class)
    public DocumentDtos.DocumentResponse finalizeUpload(UserPrincipal principal,UUID id) {
        Document document=ownedDocument(principal,id);
        if(document.isReady())return response(document);
        if("FAILED".equals(document.getStatus()))
            throw new ResponseStatusException(HttpStatus.CONFLICT,"This upload has failed. Start a new upload.");
        DocumentObjectStorage.ObjectMetadata metadata; byte[] bytes;
        try {
            metadata=storage.headObject(document.getStorageKey());
            if(metadata==null)throw new ResponseStatusException(HttpStatus.CONFLICT,"The uploaded file is not available yet.");
            if(metadata.contentLength()!=document.getSizeBytes()||metadata.contentType()==null
                    ||!metadata.contentType().equalsIgnoreCase(document.getContentType()))
                return failUpload(document,"Uploaded file metadata did not match the requested upload.");
            bytes=storage.readObject(document.getStorageKey(),(int)MAX_FILE_BYTES);
        } catch(ResponseStatusException exception) {throw exception;}
        catch(RuntimeException exception) {throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Document storage is temporarily unavailable.");}
        if(bytes==null||bytes.length!=document.getSizeBytes()||bytes.length>MAX_FILE_BYTES)
            return failUpload(document,"Uploaded file size could not be verified.");
        String checksum=sha256Base64(bytes);
        if(!MessageDigest.isEqual(checksum.getBytes(StandardCharsets.US_ASCII),document.getChecksumSha256().getBytes(StandardCharsets.US_ASCII)))
            return failUpload(document,"Uploaded file checksum did not match.");
        if(!signatureMatches(document.getContentType(),bytes))
            return failUpload(document,"Uploaded file content does not match its declared file type.");
        document.markReady(checksum);
        return response(document);
    }
    @Transactional(readOnly=true)
    public DocumentDtos.DocumentList list(UserPrincipal principal,UUID thingId) {
        List<Document> items=thingId==null?documents.findByUserIdAndStatusOrderByCreatedAtDesc(principal.getId(),"READY")
            :documents.findByUserIdAndThingIdAndStatusOrderByCreatedAtDesc(principal.getId(),thingId,"READY");
        return new DocumentDtos.DocumentList(items.stream().map(this::response).toList());
    }
    @Transactional(readOnly=true)
    public DocumentDtos.DownloadUrlResponse createDownloadUrl(UserPrincipal principal,UUID id) {
        Document document=ownedDocument(principal,id);
        if(!document.isReady())throw new ResponseStatusException(HttpStatus.CONFLICT,"Document is not ready to download.");
        var target=storage.presignDownload(document.getStorageKey(),document.getFileName(),document.getContentType());
        return new DocumentDtos.DownloadUrlResponse(target.url(),target.expiresAt());
    }
    @Transactional
    public void delete(UserPrincipal principal,UUID id) {
        Document document=ownedDocument(principal,id);
        try {storage.deleteObject(document.getStorageKey());}
        catch(RuntimeException exception) {throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,"Document storage is temporarily unavailable.");}
        documents.delete(document);
    }
    @Transactional(readOnly=true)
    public Document ownedDocument(UserPrincipal principal,UUID id) {
        return documents.findByIdAndUserId(id,principal.getId()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Document not found"));
    }
    public DocumentDtos.DocumentResponse response(Document document) {
        String thingName=null;
        if(document.getThingId()!=null)thingName=things.findById(document.getThingId())
            .filter(thing->thing.getUserId().equals(document.getUserId())).map(Thing::getName).orElse(null);
        return new DocumentDtos.DocumentResponse(document.getId(),document.getFileName(),document.getContentType(),document.getSizeBytes(),
            document.getChecksumSha256(),document.getThingId(),thingName,document.getCreatedAt(),document.getStatus(),document.getExtractionStatus());
    }
    private DocumentDtos.DocumentResponse failUpload(Document document,String message) {
        document.markFailed();
        try {storage.deleteObject(document.getStorageKey());} catch(RuntimeException ignored) {}
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST,message);
    }
    private static String sanitizeFileName(String raw) {
        String value=raw==null?"":raw.replace('\\','/');int slash=value.lastIndexOf('/');
        String name=(slash>=0?value.substring(slash+1):value).trim();
        if(name.isBlank()||name.length()>255||name.chars().anyMatch(Character::isISOControl))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"A valid file name is required.");
        return name;
    }
    private static boolean isAllowedType(String name,String contentType) {
        String lower=name.toLowerCase(Locale.ROOT),mime=contentType==null?"":contentType.toLowerCase(Locale.ROOT).trim();
        return (lower.endsWith(".pdf")&&mime.equals("application/pdf"))
            ||((lower.endsWith(".jpg")||lower.endsWith(".jpeg"))&&mime.equals("image/jpeg"))
            ||(lower.endsWith(".png")&&mime.equals("image/png"));
    }
    private static boolean signatureMatches(String type,byte[] bytes) {
        if(bytes.length<3)return false;
        return switch(type.toLowerCase(Locale.ROOT)) {
            case "application/pdf" -> startsWith(bytes,new byte[]{'%', 'P', 'D', 'F', '-'});
            case "image/png" -> startsWith(bytes,new byte[]{(byte)0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A});
            case "image/jpeg" -> bytes[0]==(byte)0xFF&&bytes[1]==(byte)0xD8&&bytes[2]==(byte)0xFF;
            default -> false;
        };
    }
    private static boolean startsWith(byte[] content,byte[] prefix) {
        if(content.length<prefix.length)return false;
        for(int i=0;i<prefix.length;i++)if(content[i]!=prefix[i])return false;
        return true;
    }
    private static String sha256Base64(byte[] bytes) {
        try{return Base64.getEncoder().encodeToString(MessageDigest.getInstance("SHA-256").digest(bytes));}
        catch(NoSuchAlgorithmException e){throw new IllegalStateException("SHA-256 is not available.",e);}
    }
}
