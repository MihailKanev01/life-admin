package com.lifeadmin.api.reminder;

import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.Valid;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/reminders")
public class ReminderController {

    private final ReminderService reminders;

    public ReminderController(ReminderService reminders) {
        this.reminders = reminders;
    }

    @GetMapping
    public ReminderDtos.ReminderList list(@AuthenticationPrincipal UserPrincipal principal) {
        return new ReminderDtos.ReminderList(
                reminders.open(principal).stream().map(reminders::response).toList());
    }

    @PostMapping
    public ReminderDtos.ReminderResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ReminderDtos.CreateRequest request) {
        return reminders.response(reminders.create(principal, request));
    }

    @PostMapping("/{id}/complete")
    public ReminderDtos.ReminderResponse complete(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return reminders.response(reminders.complete(principal, id));
    }

    @PostMapping("/{id}/snooze")
    public ReminderDtos.ReminderResponse snooze(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ReminderDtos.SnoozeRequest request) {
        return reminders.response(reminders.snooze(principal, id, request.dueDate()));
    }

    private static LocalDate unused(LocalDate date) {
        return date;
    }
}
