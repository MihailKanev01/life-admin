package com.lifeadmin.api.document;
import java.util.UUID;
import jakarta.validation.Valid;
import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/v1/documents")
public class DocumentController {
    private final DocumentService documents;
    public DocumentController(DocumentService documents){this.documents=documents;}

    @PostMapping("/upload-sessions")
    public DocumentDtos.UploadSessionResponse createUploadSession(@AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody DocumentDtos.UploadSessionRequest request) {
        return documents.createUploadSession(principal,request);
    }
    @PostMapping("/{id}/finalize")
    public DocumentDtos.DocumentResponse finalizeUpload(@AuthenticationPrincipal UserPrincipal principal,@PathVariable UUID id) {
        return documents.finalizeUpload(principal,id);
    }
    @GetMapping
    public DocumentDtos.DocumentList list(@AuthenticationPrincipal UserPrincipal principal,@RequestParam(required=false) UUID thingId) {
        return documents.list(principal,thingId);
    }
    @GetMapping("/{id}/download-url")
    public DocumentDtos.DownloadUrlResponse downloadUrl(@AuthenticationPrincipal UserPrincipal principal,@PathVariable UUID id) {
        return documents.createDownloadUrl(principal,id);
    }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal UserPrincipal principal,@PathVariable UUID id){documents.delete(principal,id);}
}
