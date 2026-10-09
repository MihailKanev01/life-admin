CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    reminder_id UUID NOT NULL,
    channel VARCHAR(16) NOT NULL,
    days_before_due INTEGER NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    next_attempt_at TIMESTAMPTZ NOT NULL,
    status VARCHAR(24) NOT NULL,
    sent_at TIMESTAMPTZ NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error VARCHAR(100) NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    CONSTRAINT notifications_user_fk
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT notifications_reminder_fk
        FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
    CONSTRAINT notifications_channel_check CHECK (channel IN ('EMAIL')),
    CONSTRAINT notifications_days_before_check CHECK (days_before_due IN (0, 2, 7)),
    CONSTRAINT notifications_status_check CHECK (status IN ('SCHEDULED', 'SENT', 'FAILED', 'CANCELLED')),
    CONSTRAINT notifications_attempt_count_check CHECK (attempt_count >= 0)
);

CREATE INDEX notifications_due_idx ON notifications (status, next_attempt_at);
CREATE INDEX notifications_reminder_status_idx ON notifications (reminder_id, status);
CREATE INDEX notifications_user_scheduled_idx ON notifications (user_id, scheduled_at DESC);
