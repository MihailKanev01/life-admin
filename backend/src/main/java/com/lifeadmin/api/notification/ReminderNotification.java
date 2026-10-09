package com.lifeadmin.api.notification;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "notifications")
public class ReminderNotification {

    public static final String EMAIL = "EMAIL";
    public static final String SCHEDULED = "SCHEDULED";
    public static final String SENT = "SENT";
    public static final String FAILED = "FAILED";
    public static final String CANCELLED = "CANCELLED";
    private static final int MAX_ATTEMPTS = 3;

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "reminder_id", nullable = false)
    private UUID reminderId;

    @Column(nullable = false, length = 16)
    private String channel;

    @Column(name = "days_before_due", nullable = false)
    private int daysBeforeDue;

    @Column(name = "scheduled_at", nullable = false)
    private Instant scheduledAt;

    @Column(name = "next_attempt_at", nullable = false)
    private Instant nextAttemptAt;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "sent_at")
    private Instant sentAt;

    @Column(name = "attempt_count", nullable = false)
    private int attemptCount;

    @Column(name = "last_error", length = 100)
    private String lastError;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private long version;

    protected ReminderNotification() {}

    public ReminderNotification(UUID userId, UUID reminderId, int daysBeforeDue, Instant scheduledAt) {
        this.userId = userId;
        this.reminderId = reminderId;
        this.channel = EMAIL;
        this.daysBeforeDue = daysBeforeDue;
        this.scheduledAt = scheduledAt;
        this.nextAttemptAt = scheduledAt;
        this.status = SCHEDULED;
        this.attemptCount = 0;
    }

    @PrePersist
    void onCreate() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = Instant.now();
    }

    public void markSent(Instant at) {
        if (!SCHEDULED.equals(status)) return;
        status = SENT;
        sentAt = at;
        lastError = null;
        updatedAt = at;
    }

    public void cancel(Instant at) {
        if (!SCHEDULED.equals(status)) return;
        status = CANCELLED;
        updatedAt = at;
    }

    public void recordFailure(Instant at, String errorType) {
        if (!SCHEDULED.equals(status)) return;
        attemptCount++;
        lastError = errorType == null || errorType.isBlank()
                ? "DELIVERY_FAILED"
                : errorType.substring(0, Math.min(errorType.length(), 100));
        updatedAt = at;

        if (attemptCount >= MAX_ATTEMPTS) {
            status = FAILED;
            return;
        }

        long retryMinutes = attemptCount == 1 ? 5 : 30;
        nextAttemptAt = at.plus(Duration.ofMinutes(retryMinutes));
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getReminderId() { return reminderId; }
    public String getChannel() { return channel; }
    public int getDaysBeforeDue() { return daysBeforeDue; }
    public Instant getScheduledAt() { return scheduledAt; }
    public Instant getNextAttemptAt() { return nextAttemptAt; }
    public String getStatus() { return status; }
    public Instant getSentAt() { return sentAt; }
    public int getAttemptCount() { return attemptCount; }
    public String getLastError() { return lastError; }
    public long getVersion() { return version; }
}
