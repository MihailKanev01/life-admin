package com.lifeadmin.api.notification;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReminderNotificationRepository extends JpaRepository<ReminderNotification, UUID> {

    List<ReminderNotification> findByReminderIdOrderByScheduledAtAsc(UUID reminderId);

    List<ReminderNotification> findByReminderIdAndStatus(UUID reminderId, String status);

    @Query("""
            select n.id from ReminderNotification n
            where n.status = :status
              and n.nextAttemptAt <= :now
            order by n.nextAttemptAt asc
            """)
    List<UUID> findDueIds(
            @Param("status") String status,
            @Param("now") Instant now,
            Pageable pageable);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select n from ReminderNotification n where n.id = :id")
    Optional<ReminderNotification> findByIdForUpdate(@Param("id") UUID id);
}
