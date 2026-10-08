
package com.lifeadmin.api.reminder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "reminders")
public class Reminder {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "thing_id")
    private UUID thingId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 160)
    private String context;

    @Column(name = "due_date")
    private LocalDate dueDate;

    @Column(nullable = false, length = 24)
    private String status;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "completed_at")
    private Instant completedAt;

    protected Reminder() {
    }

    public Reminder(UUID userId, String title, String context, LocalDate dueDate, UUID thingId) {
        this.userId = userId;
        this.thingId = thingId;
        this.title = title;
        this.context = context;
        this.dueDate = dueDate;
        this.status = "OPEN";
    }

    @PrePersist
    void onCreate() {
        createdAt = Instant.now();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getThingId() { return thingId; }
    public String getTitle() { return title; }
    public String getContext() { return context; }
    public LocalDate getDueDate() { return dueDate; }
    public String getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getCompletedAt() { return completedAt; }

    public void update(String title, String context, LocalDate dueDate, UUID thingId) {
        this.title = title;
        this.context = context;
        this.dueDate = dueDate;
        this.thingId = thingId;
        this.status = "OPEN";
    }

    public void complete() {
        status = "COMPLETED";
        completedAt = Instant.now();
    }

    public void snoozeUntil(LocalDate date) {
        dueDate = date;
        status = "OPEN";
    }

    public void rescheduleTo(LocalDate date) {
        dueDate = date;
        status = "OPEN";
    }
}
