package com.lifeadmin.api.document;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.function.Executable;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

class S3DocumentObjectStorageTests {

    @Test
    void missingBucketDoesNotPreventConstructionAndDocumentOperationsReturnServiceUnavailable() {
        DocumentObjectStorage storage = new S3DocumentObjectStorage(null, null, " ");

        assertUnavailable(() -> storage.presignUpload("key", "application/pdf", "checksum"));
        assertUnavailable(() -> storage.presignDownload("key", "document.pdf", "application/pdf"));
        assertUnavailable(() -> storage.headObject("key"));
        assertUnavailable(() -> storage.readObject("key", 1024));
        assertUnavailable(() -> storage.deleteObject("key"));
    }

    private static void assertUnavailable(Executable operation) {
        ResponseStatusException exception =
                assertThrows(ResponseStatusException.class, operation);
        assertEquals(HttpStatus.SERVICE_UNAVAILABLE, exception.getStatusCode());
    }
}
