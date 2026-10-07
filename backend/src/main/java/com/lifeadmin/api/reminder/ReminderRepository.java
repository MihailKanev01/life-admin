package com.lifeadmin.api.reminder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    List<Reminder> findByUserIdAndStatusOrderByDueDateAscCreatedAtDesc(UUID userId, String status);

    Optional<Reminder> findByIdAndUserId(UUID id, UUID userId);
}
