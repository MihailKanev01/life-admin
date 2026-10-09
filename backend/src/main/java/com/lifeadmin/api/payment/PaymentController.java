package com.lifeadmin.api.payment;

import java.util.UUID;

import jakarta.validation.Valid;

import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final PaymentService payments;

    public PaymentController(PaymentService payments) {
        this.payments = payments;
    }

    @GetMapping
    public PaymentDtos.PaymentList list(@AuthenticationPrincipal UserPrincipal principal) {
        return new PaymentDtos.PaymentList(
                payments.list(principal).stream().map(payments::response).toList());
    }

    @GetMapping("/{id}")
    public PaymentDtos.PaymentResponse get(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return payments.response(payments.get(principal, id));
    }

    @PostMapping
    public PaymentDtos.PaymentResponse create(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody PaymentDtos.CreateRequest request) {
        return payments.response(payments.create(principal, request));
    }

    @PatchMapping("/{id}")
    public PaymentDtos.PaymentResponse update(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody PaymentDtos.UpdateRequest request) {
        return payments.response(payments.update(principal, id, request));
    }

    @PostMapping("/{id}/mark-paid")
    public PaymentDtos.PaymentResponse markPaid(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return payments.response(payments.markPaid(principal, id));
    }

    @PostMapping("/{id}/skip")
    public PaymentDtos.PaymentResponse skip(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return payments.response(payments.skip(principal, id));
    }

    @PostMapping("/{id}/cancel")
    public PaymentDtos.PaymentResponse cancel(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        return payments.response(payments.cancelTracking(principal, id));
    }
}
