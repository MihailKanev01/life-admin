ALTER TABLE things ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;

DROP INDEX things_user_name_unique;

CREATE UNIQUE INDEX things_user_name_active_unique
    ON things (user_id, lower(name))
    WHERE archived = FALSE;
