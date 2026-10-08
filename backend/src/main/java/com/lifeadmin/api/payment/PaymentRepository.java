package com.lifeadmin.api.payment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    List<Payment> findByUserIdAndStatusOrderByNextDueDateAscCreatedAtDesc(UUID userId, String status);

    Optional<Payment> findByIdAndUserId(UUID id, UUID userId);

    long countByUserIdAndThingIdAndStatus(UUID userId, UUID thingId, String status);

    @Query("""
            select p from Payment p
            where p.userId = :userId
              and p.status = 'ACTIVE'
              and (
                lower(p.name) like lower(concat('%', :query, '%'))
                or lower(p.type) like lower(concat('%', :query, '%'))
                or lower(p.frequency) like lower(concat('%', :query, '%'))
              )
            order by p.createdAt desc
            """)
    List<Payment> search(@Param("userId") UUID userId, @Param("query") String query);
}
