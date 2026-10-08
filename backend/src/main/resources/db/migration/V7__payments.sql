CREATE TABLE payments (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    thing_id UUID NULL,
    name VARCHAR(200) NOT NULL,
    type VARCHAR(24) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(3) NOT NULL,
    frequency VARCHAR(16) NOT NULL,
    next_due_date DATE NULL,
    status VARCHAR(16) NOT NULL,
    last_paid_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT payments_user_fk FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT payments_thing_fk FOREIGN KEY (thing_id) REFERENCES things(id) ON DELETE SET NULL
);

CREATE INDEX payments_user_status_due_idx
    ON payments (user_id, status, next_due_date);

CREATE INDEX payments_user_thing_idx
    ON payments (user_id, thing_id);
