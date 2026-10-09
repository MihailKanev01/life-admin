package com.lifeadmin.api.thing;

import java.util.List;
import java.util.UUID;

import com.lifeadmin.api.reminder.ReminderRepository;
import com.lifeadmin.api.payment.PaymentRepository;
import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class ThingService {

    private final ThingRepository things;
    private final ReminderRepository reminders;
    private final PaymentRepository payments;

    public ThingService(ThingRepository things, ReminderRepository reminders, PaymentRepository payments) {
        this.things = things;
        this.reminders = reminders;
        this.payments = payments;
    }

    @Transactional(readOnly = true)
    public List<Thing> list(UserPrincipal principal) {
        return things.findByUserIdAndArchivedFalseOrderByCreatedAtDesc(principal.getId());
    }

    @Transactional(readOnly = true)
    public Thing get(UserPrincipal principal, UUID id) {
        return things.findByIdAndUserIdAndArchivedFalse(id, principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found"));
    }

    @Transactional
    public Thing update(UserPrincipal principal, UUID id, ThingDtos.UpdateRequest request) {
        Thing thing = get(principal, id);
        String name = request.name().trim();
        String type = request.type().trim();
        String detail = request.detail() == null ? null : request.detail().trim();

        if (things.existsByUserIdAndNameIgnoreCaseAndArchivedFalseAndIdNot(principal.getId(), name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A thing with this name already exists");
        }

        thing.update(name, type, detail);
        return thing;
    }

    @Transactional
    public void archive(UserPrincipal principal, UUID id) {
        Thing thing = get(principal, id);
        thing.archive();
    }

    @Transactional
    public Thing create(UserPrincipal principal, ThingDtos.CreateRequest request) {
        String name = request.name().trim();
        String type = request.type().trim();
        String detail = request.detail() == null ? null : request.detail().trim();

        if (things.existsByUserIdAndNameIgnoreCaseAndArchivedFalse(principal.getId(), name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A thing with this name already exists");
        }

        return things.save(new Thing(principal.getId(), name, type, detail));
    }

    public ThingDtos.ThingResponse response(Thing thing) {
        return new ThingDtos.ThingResponse(
                thing.getId(),
                thing.getName(),
                thing.getType(),
                thing.getDetail(),
                reminders.countByUserIdAndThingIdAndStatus(
                        thing.getUserId(), thing.getId(), "OPEN"),
                payments.countByUserIdAndThingIdAndStatus(
                        thing.getUserId(), thing.getId(), "ACTIVE"),
                thing.getCreatedAt());
    }

}
