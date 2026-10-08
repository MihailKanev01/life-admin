package com.lifeadmin.api.search;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import com.lifeadmin.api.payment.PaymentRepository;
import com.lifeadmin.api.reminder.ReminderRepository;
import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SearchService {

    private final ThingRepository things;
    private final ReminderRepository reminders;
    private final PaymentRepository payments;

    public SearchService(
            ThingRepository things,
            ReminderRepository reminders,
            PaymentRepository payments) {
        this.things = things;
        this.reminders = reminders;
        this.payments = payments;
    }

    @Transactional(readOnly = true)
    public List<SearchDtos.SearchResult> search(UserPrincipal principal, String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.isBlank()) {
            return List.of();
        }

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

        return matches.stream()
                .sorted(Comparator
                        .comparingInt(ScoredResult::score)
                        .thenComparing(ScoredResult::result, Comparator.comparing(
                                SearchDtos.SearchResult::createdAt,
                                Comparator.nullsLast(Comparator.reverseOrder()))))
                .limit(50)
                .map(ScoredResult::result)
                .toList();
    }

    private static int score(String query, String... fields) {
        for (String field : fields) {
            if (field != null && field.equalsIgnoreCase(query)) {
                return 0;
            }
        }
        for (String field : fields) {
            if (field != null && field.toLowerCase().startsWith(query)) {
                return 1;
            }
        }
        return 2;
    }

    private record ScoredResult(int score, SearchDtos.SearchResult result) {}
}
