CREATE TABLE things (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(80) NOT NULL,
    detail VARCHAR(200) NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT things_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX things_user_created_idx ON things (user_id, created_at DESC);
CREATE UNIQUE INDEX things_user_name_unique ON things (user_id, lower(name));
