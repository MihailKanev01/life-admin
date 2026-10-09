package com.lifeadmin.api.thing;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ThingRepository extends JpaRepository<Thing, UUID> {

    List<Thing> findByUserIdAndArchivedFalseOrderByCreatedAtDesc(UUID userId);

    Optional<Thing> findByIdAndUserIdAndArchivedFalse(UUID id, UUID userId);

    Optional<Thing> findByUserIdAndNameIgnoreCaseAndArchivedFalse(UUID userId, String name);

    boolean existsByUserIdAndNameIgnoreCaseAndArchivedFalse(UUID userId, String name);

    boolean existsByUserIdAndNameIgnoreCaseAndArchivedFalseAndIdNot(UUID userId, String name, UUID id);

    @Query("""
            select t from Thing t
            where t.userId = :userId
              and t.archived = false
              and (
                lower(t.name) like lower(concat('%', :query, '%'))
                or lower(t.type) like lower(concat('%', :query, '%'))
                or lower(coalesce(t.detail, '')) like lower(concat('%', :query, '%'))
              )
            order by t.createdAt desc
            """)
    List<Thing> search(@Param("userId") UUID userId, @Param("query") String query);
}
