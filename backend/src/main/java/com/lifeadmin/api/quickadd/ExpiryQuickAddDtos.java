package com.lifeadmin.api.quickadd;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class ExpiryQuickAddDtos {

    private ExpiryQuickAddDtos() {}

    public record Request(
            UUID thingId,
            @Size(max = 200) String thingName,
            @Size(max = 80) String thingType,
            @NotBlank @Size(max = 160) String recordTitle,
            @NotNull LocalDate expiresOn,
            @NotNull LocalDate reminderOn) {}

    public record Response(
            UUID thingId,
            String thingName,
            boolean thingCreated,
            UUID noteId,
            UUID reminderId,
            LocalDate expiresOn,
            LocalDate reminderOn) {}
}
