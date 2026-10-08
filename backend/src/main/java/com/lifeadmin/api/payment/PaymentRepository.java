package com.lifeadmin.api.payment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdAndStatusOrderByNextDueDateAscCreatedAtDesc(UUID userId, String status);

    Optional<Payment> findByIdAndUserId(UUID id, UUID userId);
}
