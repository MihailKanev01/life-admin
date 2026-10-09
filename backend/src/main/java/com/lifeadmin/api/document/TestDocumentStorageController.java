package com.lifeadmin.api.document;
import java.nio.charset.StandardCharsets;
import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.context.annotation.Profile;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api/v1/documents/test-storage") @Profile("test")
public class TestDocumentStorageController {
    private final DocumentRepository documents; private final InMemoryDocumentObjectStorage storage;
    public TestDocumentStorageController(DocumentRepository documents,InMemoryDocumentObjectStorage storage) {
        this.documents=documents;this.storage=storage;
    }
    @PutMapping(value="/{encodedKey}",consumes=MediaType.ALL_VALUE)
    public ResponseEntity<Void> upload(@AuthenticationPrincipal UserPrincipal principal,@PathVariable String encodedKey,
        @RequestParam String token,@RequestHeader(HttpHeaders.CONTENT_TYPE) String contentType,
        @RequestHeader("x-amz-checksum-sha256") String checksum,@RequestBody byte[] bytes) {
        String key=storage.decodeKey(encodedKey);
        Document document=documents.findByStorageKeyAndUserId(key,principal.getId())
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Upload target not found"));
        if(!"UPLOADING".equals(document.getStatus()))throw new ResponseStatusException(HttpStatus.CONFLICT,"Upload target is no longer active");
        String normalizedContentType=contentType.split(";",2)[0].trim();
        storage.acceptUpload(key,token,normalizedContentType,checksum,bytes);
        return ResponseEntity.noContent().build();
    }
    @GetMapping("/{encodedKey}/download")
    public ResponseEntity<byte[]> download(@AuthenticationPrincipal UserPrincipal principal,@PathVariable String encodedKey,@RequestParam String token) {
        String key=storage.decodeKey(encodedKey);
        Document document=documents.findByStorageKeyAndUserId(key,principal.getId()).filter(Document::isReady)
            .orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND,"Document not found"));
        byte[] bytes=storage.readForDownload(key,token);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(document.getContentType()))
            .header(HttpHeaders.CONTENT_DISPOSITION,ContentDisposition.attachment()
                .filename(document.getFileName(),StandardCharsets.UTF_8).build().toString()).body(bytes);
    }
}
