package com.lifeadmin.api.reminder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReminderRepository extends JpaRepository<Reminder, UUID> {

    List<Reminder> findByUserIdAndStatusOrderByDueDateAscCreatedAtDesc(UUID userId, String status);

    Optional<Reminder> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndThingIdAndStatus(UUID userId, UUID thingId, String status);

    @Query("""
            select r from Reminder r
            where r.userId = :userId
              and (
                lower(r.title) like lower(concat('%', :query, '%'))
                or lower(r.context) like lower(concat('%', :query, '%'))
              )
            order by r.createdAt desc
            """)
    List<Reminder> search(@Param("userId") UUID userId, @Param("query") String query);
}
