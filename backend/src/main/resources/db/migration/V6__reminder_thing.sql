ALTER TABLE reminders
    ADD COLUMN thing_id UUID NULL;

ALTER TABLE reminders
    ADD CONSTRAINT reminders_thing_fk
    FOREIGN KEY (thing_id) REFERENCES things(id) ON DELETE SET NULL;

CREATE INDEX reminders_user_thing_status_idx
    ON reminders (user_id, thing_id, status);
