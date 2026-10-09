package com.lifeadmin.api.payment;

import java.util.List;
import java.util.UUID;

import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.ThingRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PaymentService {

    private final PaymentRepository payments;
    private final ThingRepository things;

    public PaymentService(PaymentRepository payments, ThingRepository things) {
        this.payments = payments;
        this.things = things;
    }

    @Transactional(readOnly = true)
    public List<Payment> list(UserPrincipal principal) {
        return payments.findByUserIdAndStatusOrderByNextDueDateAscCreatedAtDesc(principal.getId(), "ACTIVE");
    }

    @Transactional(readOnly = true)
    public Payment get(UserPrincipal principal, UUID id) {
        return payments.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
    }

    @Transactional
    public Payment create(UserPrincipal principal, PaymentDtos.CreateRequest request) {
        UUID thingId = request.thingId();
        if (thingId != null && things.findByIdAndUserIdAndArchivedFalse(thingId, principal.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }

        String name = request.name().trim();
        String type = request.type().trim().toUpperCase();
        String currency = request.currency() == null ? "EUR" : request.currency().trim().toUpperCase();
        String frequency = request.frequency().trim().toUpperCase();

        if (!List.of("BILL", "SUBSCRIPTION", "RENEWAL").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment type");
        }
        if (!List.of("WEEKLY", "MONTHLY", "YEARLY").contains(frequency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment frequency");
        }

        return payments.save(new Payment(
                principal.getId(),
                thingId,
                name,
                type,
                request.amount(),
                currency,
                frequency,
                request.nextDueDate()));
    }

    @Transactional
    public Payment update(UserPrincipal principal, UUID id, PaymentDtos.UpdateRequest request) {
        Payment payment = get(principal, id);

        UUID thingId = request.thingId();
        if (thingId != null && things.findByIdAndUserIdAndArchivedFalse(thingId, principal.getId()).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Thing not found");
        }

        String name = request.name().trim();
        String type = request.type().trim().toUpperCase();
        String currency = request.currency() == null ? "EUR" : request.currency().trim().toUpperCase();
        String frequency = request.frequency().trim().toUpperCase();

        if (!List.of("BILL", "SUBSCRIPTION", "RENEWAL").contains(type)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment type");
        }
        if (!List.of("WEEKLY", "MONTHLY", "YEARLY").contains(frequency)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported payment frequency");
        }

        payment.update(name, type, request.amount(), currency, frequency, request.nextDueDate(), thingId);
        return payment;
    }

    @Transactional
    public Payment markPaid(UserPrincipal principal, UUID id) {
        Payment payment = requireActive(principal, id);
        payment.markPaid();
        return payment;
    }

    @Transactional
    public Payment skip(UserPrincipal principal, UUID id) {
        Payment payment = requireActive(principal, id);
        if (payment.getNextDueDate() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This payment needs a next due date before it can be skipped");
        }
        payment.skip();
        return payment;
    }

    @Transactional
    public Payment cancelTracking(UserPrincipal principal, UUID id) {
        Payment payment = requireActive(principal, id);
        payment.cancelTracking();
        return payment;
    }

    private Payment requireActive(UserPrincipal principal, UUID id) {
        Payment payment = payments.findByIdAndUserId(id, principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Payment not found"));
        if (!"ACTIVE".equals(payment.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Payment is no longer active");
        }
        return payment;
    }

    public PaymentDtos.PaymentResponse response(Payment payment) {
        return new PaymentDtos.PaymentResponse(
                payment.getId(),
                payment.getThingId(),
                payment.getName(),
                payment.getType(),
                payment.getAmount(),
                payment.getCurrency(),
                payment.getFrequency(),
                payment.getNextDueDate(),
                payment.getStatus(),
                payment.getLastPaidAt(),
                payment.getCreatedAt());
    }
}
