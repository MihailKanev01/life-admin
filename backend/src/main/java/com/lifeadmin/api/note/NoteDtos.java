package com.lifeadmin.api.note;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class NoteDtos {

    private NoteDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 5000) String body,
            @NotNull UUID thingId) {}

    public record UpdateRequest(
            @NotBlank @Size(max = 160) String title,
            @NotBlank @Size(max = 5000) String body) {}

    public record NoteResponse(
            UUID id,
            String title,
            String body,
            UUID thingId,
            String thingName,
            Instant createdAt,
            Instant updatedAt) {}

    public record NoteList(List<NoteResponse> items) {}
}
