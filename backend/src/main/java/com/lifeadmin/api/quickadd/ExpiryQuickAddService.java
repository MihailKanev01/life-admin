package com.lifeadmin.api.quickadd;

import java.time.LocalDate;
import java.util.UUID;

import com.lifeadmin.api.note.Note;
import com.lifeadmin.api.note.NoteRepository;
import com.lifeadmin.api.reminder.Reminder;
import com.lifeadmin.api.reminder.ReminderRepository;
import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.Thing;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ExpiryQuickAddService {

    private static final long REMINDER_LEAD_DAYS = 30;

    private final ThingRepository things;
    private final NoteRepository notes;
    private final ReminderRepository reminders;

    public ExpiryQuickAddService(
            ThingRepository things,
            NoteRepository notes,
            ReminderRepository reminders) {
        this.things = things;
        this.notes = notes;
        this.reminders = reminders;
    }

    @Transactional
    public ExpiryQuickAddDtos.Response capture(
            UserPrincipal principal, ExpiryQuickAddDtos.Request request) {
        LocalDate expiresOn = request.expiresOn();
        LocalDate reminderOn = request.reminderOn();
        if (!reminderOn.equals(expiresOn.minusDays(REMINDER_LEAD_DAYS))) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "The suggested reminder must be 30 days before expiry.");
        }

        Thing thing;
        boolean thingCreated = false;
        if (request.thingId() != null) {
            thing = things.findByIdAndUserIdAndArchivedFalse(request.thingId(), principal.getId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found"));
        } else {
            String thingName = request.thingName() == null ? "" : request.thingName().trim();
            if (thingName.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a Thing or provide a name.");
            }

            thing = things.findByUserIdAndNameIgnoreCaseAndArchivedFalse(principal.getId(), thingName)
                    .orElse(null);
            if (thing == null) {
                String type = request.thingType() == null || request.thingType().isBlank()
                        ? "Other"
                        : request.thingType().trim();
                thing = things.save(new Thing(principal.getId(), thingName, type, null));
                thingCreated = true;
            }
        }

        String recordTitle = request.recordTitle().trim();
        String noteBody = "Expires on " + expiresOn
                + ". Reminder scheduled for " + reminderOn
                + " (30 days before expiry).";
        Note note = notes.save(new Note(principal.getId(), thing.getId(), recordTitle, noteBody));

        Reminder reminder = reminders.save(new Reminder(
                principal.getId(),
                recordTitle + " reminder",
                thing.getName(),
                reminderOn,
                thing.getId()));

        return new ExpiryQuickAddDtos.Response(
                thing.getId(),
                thing.getName(),
                thingCreated,
                note.getId(),
                reminder.getId(),
                expiresOn,
                reminderOn);
    }
}
