package com.lifeadmin.api.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "payments")
public class Payment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "thing_id")
    private UUID thingId;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(nullable = false, length = 24)
    private String type;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency;

    @Column(nullable = false, length = 16)
    private String frequency;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    @Column(nullable = false, length = 16)
    private String status;

    @Column(name = "last_paid_at")
    private Instant lastPaidAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Payment() {
    }

    public Payment(
            UUID userId,
            UUID thingId,
            String name,
            String type,
            BigDecimal amount,
            String currency,
            String frequency,
            LocalDate nextDueDate) {
        this.userId = userId;
        this.thingId = thingId;
        this.name = name;
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.frequency = frequency;
        this.nextDueDate = nextDueDate;
        this.status = "ACTIVE";
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

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getThingId() { return thingId; }
    public String getName() { return name; }
    public String getType() { return type; }
    public BigDecimal getAmount() { return amount; }
    public String getCurrency() { return currency; }
    public String getFrequency() { return frequency; }
    public LocalDate getNextDueDate() { return nextDueDate; }
    public String getStatus() { return status; }
    public Instant getLastPaidAt() { return lastPaidAt; }
    public Instant getCreatedAt() { return createdAt; }

    public void update(
            String name,
            String type,
            BigDecimal amount,
            String currency,
            String frequency,
            LocalDate nextDueDate,
            UUID thingId) {
        this.name = name;
        this.type = type;
        this.amount = amount;
        this.currency = currency;
        this.frequency = frequency;
        this.nextDueDate = nextDueDate;
        this.thingId = thingId;
    }

    public void skip() {
        if (nextDueDate != null) {
            nextDueDate = switch (frequency) {
                case "WEEKLY" -> nextDueDate.plusWeeks(1);
                case "YEARLY" -> nextDueDate.plusYears(1);
                default -> nextDueDate.plusMonths(1);
            };
        }
    }

    public void cancelTracking() {
        status = "CANCELLED";
    }

    public void markPaid() {
        lastPaidAt = Instant.now();
        if (nextDueDate != null) {
            nextDueDate = switch (frequency) {
                case "WEEKLY" -> nextDueDate.plusWeeks(1);
                case "YEARLY" -> nextDueDate.plusYears(1);
                default -> nextDueDate.plusMonths(1);
            };
        }
    }
}
