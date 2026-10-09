CREATE TABLE notes (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    thing_id UUID NOT NULL,
    title VARCHAR(160) NOT NULL,
    body VARCHAR(5000) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT notes_title_nonblank CHECK (length(trim(title)) > 0),
    CONSTRAINT notes_body_nonblank CHECK (length(trim(body)) > 0),
    CONSTRAINT notes_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT notes_thing_fk FOREIGN KEY (thing_id) REFERENCES things(id) ON DELETE CASCADE
);
CREATE INDEX notes_user_updated_idx ON notes (user_id, updated_at DESC);
CREATE INDEX notes_user_thing_updated_idx ON notes (user_id, thing_id, updated_at DESC);
