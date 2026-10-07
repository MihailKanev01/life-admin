package com.lifeadmin.api.thing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ThingRepository extends JpaRepository<Thing, UUID> {

    List<Thing> findByUserIdOrderByCreatedAtDesc(UUID userId);

    Optional<Thing> findByIdAndUserId(UUID id, UUID userId);

    boolean existsByUserIdAndNameIgnoreCase(UUID userId, String name);
}
