package disscount.storeName.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.storeName.domain.StoreNameUsage;

import java.util.UUID;

@Repository
public interface StoreNameUsageRepository extends JpaRepository<StoreNameUsage, UUID> {

    @Query("SELECT COUNT(u) > 0 FROM StoreNameUsage u WHERE u.userId = :userId AND u.suggestion.id = :suggestionId")
    boolean existsByUser(UUID userId, UUID suggestionId);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("DELETE FROM StoreNameUsage u WHERE u.userId = :userId")
    int deleteAllByUserId(UUID userId);
}
