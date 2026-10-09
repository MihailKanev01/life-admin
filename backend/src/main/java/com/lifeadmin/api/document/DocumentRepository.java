package com.lifeadmin.api.document;
import java.util.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

public interface DocumentRepository extends JpaRepository<Document, UUID> {
    Optional<Document> findByIdAndUserId(UUID id, UUID userId);
    Optional<Document> findByStorageKeyAndUserId(String storageKey, UUID userId);
    List<Document> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, String status);
    List<Document> findByUserIdAndThingIdAndStatusOrderByCreatedAtDesc(UUID userId, UUID thingId, String status);
    @Query("""
        select d from Document d where d.userId = :userId and d.status = 'READY'
        and (lower(d.fileName) like lower(concat('%', :query, '%'))
          or lower(d.contentType) like lower(concat('%', :query, '%')))
        order by d.createdAt desc
        """)
    List<Document> searchReady(@Param("userId") UUID userId, @Param("query") String query);
}
