package com.lifeadmin.api.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.lifeadmin.api.document.DocumentRepository;
import com.lifeadmin.api.note.NoteRepository;
import com.lifeadmin.api.payment.PaymentRepository;
import com.lifeadmin.api.reminder.ReminderRepository;
import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.Thing;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {
    private final ThingRepository things;
    private final ReminderRepository reminders;
    private final PaymentRepository payments;
    private final DocumentRepository documents;
    private final NoteRepository notes;

    public SearchService(
            ThingRepository things,
            ReminderRepository reminders,
            PaymentRepository payments,
            DocumentRepository documents,
            NoteRepository notes) {
        this.things = things;
        this.reminders = reminders;
        this.payments = payments;
        this.documents = documents;
        this.notes = notes;
    }

    @Transactional(readOnly = true)
    public List<SearchDtos.SearchResult> search(UserPrincipal principal, String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.isBlank()) return List.of();

        String normalized = query.toLowerCase();
        List<ScoredResult> matches = new ArrayList<>();

        things.search(principal.getId(), query).forEach(thing -> matches.add(new ScoredResult(
                score(normalized, thing.getName(), thing.getType(), thing.getDetail()),
                new SearchDtos.SearchResult(
                        thing.getId(),
                        "THING",
                        thing.getName(),
                        thing.getDetail() == null || thing.getDetail().isBlank()
                                ? thing.getType()
                                : thing.getType() + " · " + thing.getDetail(),
                        thing.getId(),
                        null,
                        thing.getCreatedAt()))));

        reminders.search(principal.getId(), query).forEach(reminder -> matches.add(new ScoredResult(
                score(normalized, reminder.getTitle(), reminder.getContext()),
                new SearchDtos.SearchResult(
                        reminder.getId(),
                        "REMINDER",
                        reminder.getTitle(),
                        reminder.getContext(),
                        reminder.getThingId(),
                        reminder.getDueDate(),
                        reminder.getCreatedAt()))));

        payments.search(principal.getId(), query).forEach(payment -> matches.add(new ScoredResult(
                score(normalized, payment.getName(), payment.getType(), payment.getFrequency()),
                new SearchDtos.SearchResult(
                        payment.getId(),
                        "PAYMENT",
                        payment.getName(),
                        payment.getType() + " · " + payment.getFrequency() + " · "
                                + payment.getAmount().toPlainString() + " " + payment.getCurrency(),
                        payment.getThingId(),
                        payment.getNextDueDate(),
                        payment.getCreatedAt()))));

        documents.searchReady(principal.getId(), query).forEach(document -> {
            String thingName = document.getThingId() == null ? null : things.findById(document.getThingId())
                    .filter(thing -> thing.getUserId().equals(principal.getId()))
                    .map(Thing::getName)
                    .orElse(null);
            String subtitle = document.getContentType() + (thingName == null ? "" : " · " + thingName);
            matches.add(new ScoredResult(
                    score(normalized, document.getFileName(), document.getContentType(), thingName),
                    new SearchDtos.SearchResult(
                            document.getId(),
                            "DOCUMENT",
                            document.getFileName(),
                            subtitle,
                            document.getThingId(),
                            null,
                            document.getCreatedAt())));
        });

        notes.search(principal.getId(), query).forEach(note -> {
            String thingName = things.findById(note.getThingId())
                    .filter(thing -> thing.getUserId().equals(principal.getId()))
                    .map(Thing::getName)
                    .orElse(null);
            String bodySnippet = note.getBody().replaceAll("\\s+", " ").trim();
            if (bodySnippet.length() > 180) bodySnippet = bodySnippet.substring(0, 177) + "…";
            String subtitle = bodySnippet + (thingName == null ? "" : " · " + thingName);
            matches.add(new ScoredResult(
                    score(normalized, note.getTitle(), note.getBody(), thingName),
                    new SearchDtos.SearchResult(
                            note.getId(),
                            "NOTE",
                            note.getTitle(),
                            subtitle,
                            note.getThingId(),
                            null,
                            note.getUpdatedAt())));
        });

        return matches.stream()
                .sorted(Comparator.comparingInt(ScoredResult::score)
                        .thenComparing(ScoredResult::result, Comparator.comparing(
                                SearchDtos.SearchResult::createdAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))))
                .limit(50)
                .map(ScoredResult::result)
                .toList();
    }

    private static int score(String query, String... fields) {
        for (String field : fields) {
            if (field != null && field.equalsIgnoreCase(query)) return 0;
        }
        for (String field : fields) {
            if (field != null && field.toLowerCase().startsWith(query)) return 1;
        }
        return 2;
    }

    private record ScoredResult(int score, SearchDtos.SearchResult result) {}
}
