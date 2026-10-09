CREATE TABLE documents (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    thing_id UUID NULL,
    storage_key VARCHAR(512) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL CHECK (size_bytes > 0 AND size_bytes <= 10485760),
    checksum_sha256 VARCHAR(44) NOT NULL,
    status VARCHAR(16) NOT NULL CHECK (status IN ('UPLOADING', 'READY', 'FAILED')),
    extraction_status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT documents_storage_key_unique UNIQUE (storage_key),
    CONSTRAINT documents_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT documents_thing_fk FOREIGN KEY (thing_id) REFERENCES things(id) ON DELETE SET NULL
);
CREATE INDEX documents_user_status_created_idx ON documents (user_id, status, created_at DESC);
CREATE INDEX documents_user_thing_status_idx ON documents (user_id, thing_id, status);
