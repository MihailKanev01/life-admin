
package com.lifeadmin.api.reminder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ReminderDtos {

    private ReminderDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 160) String context,
            LocalDate dueDate,
            UUID thingId) {}

    public record UpdateRequest(
            @NotBlank @Size(max = 200) String title,
            @NotBlank @Size(max = 160) String context,
            LocalDate dueDate,
            UUID thingId) {}

    public record SnoozeRequest(LocalDate dueDate) {}

    public record ReminderResponse(
            UUID id,
            String title,
            String context,
            LocalDate dueDate,
            UUID thingId,
            String status,
            Instant createdAt) {}

    public record ReminderList(java.util.List<ReminderResponse> items) {}
}
