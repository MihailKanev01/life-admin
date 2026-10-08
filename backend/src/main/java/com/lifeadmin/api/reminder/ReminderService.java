package com.lifeadmin.api.reminder;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ReminderService {

    private final ReminderRepository reminders;
    private final com.lifeadmin.api.thing.ThingRepository things;

    public ReminderService(ReminderRepository reminders, com.lifeadmin.api.thing.ThingRepository things) {
        this.reminders = reminders;
        this.things = things;
    }

    @Transactional(readOnly = true)
    public List<Reminder> open(UserPrincipal principal) {
        return reminders.findByUserIdAndStatusOrderByDueDateAscCreatedAtDesc(principal.getId(), "OPEN");
    }

    @Transactional
    public Reminder create(UserPrincipal principal, ReminderDtos.CreateRequest request) {
        String title = request.title().trim();
        String context = request.context().trim();
        UUID thingId=request.thingId();
        if(thingId!=null && things.findByIdAndUserId(thingId, principal.getId()).isEmpty()){
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }
        return reminders.save(new Reminder(principal.getId(), title, context, request.dueDate(), thingId));
    }

    @Transactional
    public Reminder update(UserPrincipal principal, UUID id, ReminderDtos.UpdateRequest request) {
        Reminder reminder = findOwned(principal, id);
        UUID thingId = request.thingId();
        if (thingId != null && things.findByIdAndUserId(thingId, principal.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }
        reminder.update(
                request.title().trim(),
                request.context().trim(),
                request.dueDate(),
                thingId);
        return reminder;
    }

    @Transactional
    public Reminder reschedule(UserPrincipal principal, UUID id, LocalDate date) {
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A reschedule date is required");
        }
        Reminder reminder = findOwned(principal, id);
        reminder.rescheduleTo(date);
        return reminder;
    }

    @Transactional
    public Reminder complete(UserPrincipal principal, UUID id) {
        Reminder reminder = findOwned(principal, id);
        reminder.complete();
        return reminder;
    }

    @Transactional
    public Reminder snooze(UserPrincipal principal, UUID id, LocalDate date) {
        if (date == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A snooze date is required");
        }
        Reminder reminder = findOwned(principal, id);
        reminder.snoozeUntil(date);
        return reminder;
    }

    public ReminderDtos.ReminderResponse response(Reminder reminder) {
        return new ReminderDtos.ReminderResponse(
                reminder.getId(),
                reminder.getTitle(),
                reminder.getContext(),
                reminder.getDueDate(),
                reminder.getThingId(),
                reminder.getStatus(),
                reminder.getCreatedAt());
    }

    private Reminder findOwned(UserPrincipal principal, UUID id) {
        return reminders.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Reminder not found"));
    }
}
