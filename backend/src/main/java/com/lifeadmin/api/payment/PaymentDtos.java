package com.lifeadmin.api.payment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public final class PaymentDtos {

    private PaymentDtos() {}

    public record CreateRequest(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Size(max = 24) String type,
            @NotNull @DecimalMin(value = "0.01") BigDecimal amount,
            @Pattern(regexp = "(?i)[A-Z]{3}") String currency,
            @NotBlank @Size(max = 16) String frequency,
            LocalDate nextDueDate,
            UUID thingId) {}

    public record PaymentResponse(
            UUID id,
            UUID thingId,
            String name,
            String type,
            BigDecimal amount,
            String currency,
            String frequency,
            LocalDate nextDueDate,
            String status,
            Instant lastPaidAt,
            Instant createdAt) {}

    public record PaymentList(List<PaymentResponse> items) {}
}
