package com.lifeadmin.api.search;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class SearchDtos {

    private SearchDtos() {}

    public record SearchResult(
            UUID id,
            String kind,
            String title,
            String subtitle,
            UUID thingId,
            LocalDate dueDate,
            Instant createdAt) {}

    public record SearchResponse(List<SearchResult> items) {}
}
