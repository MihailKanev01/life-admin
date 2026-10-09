package com.lifeadmin.api.note;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NoteRepository extends JpaRepository<Note, UUID> {

    Optional<Note> findByIdAndUserId(UUID id, UUID userId);

    List<Note> findByUserIdOrderByUpdatedAtDesc(UUID userId);

    List<Note> findByUserIdAndThingIdOrderByUpdatedAtDesc(UUID userId, UUID thingId);

    @Query("""
            select n from Note n
            where n.userId = :userId
              and (
                lower(n.title) like lower(concat('%', :query, '%'))
                or lower(n.body) like lower(concat('%', :query, '%'))
              )
            order by n.updatedAt desc
            """)
    List<Note> search(@Param("userId") UUID userId, @Param("query") String query);
}
