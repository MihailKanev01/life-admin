package com.lifeadmin.api.thing;

import java.time.Instant;
import java.util.UUID;
import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class ThingDtos {

    private ThingDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Size(max = 80) String type,
            @Size(max = 200) String detail) {}

    public record ThingResponse(
            UUID id,
            String name,
            String type,
            String detail,
            long openReminderCount,
            long activePaymentCount,
            Instant createdAt) {}

    public record ThingList(List<ThingResponse> items) {}
}
