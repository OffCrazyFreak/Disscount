package disscount.storeName.dao;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.storeName.domain.StoreNameSuggestion;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface StoreNameSuggestionRepository extends JpaRepository<StoreNameSuggestion, UUID> {

    @Modifying(clearAutomatically = true)
    @Query("UPDATE StoreNameSuggestion s SET s.useCount = s.useCount + 1, s.updatedAt = :now "
            + "WHERE s.normalizedName = :normalized")
    int incrementUseCount(String normalized, LocalDateTime now);

    // A name is public only from its second use, so one person's custom store never leaks on a single save.
    @Query("SELECT s FROM StoreNameSuggestion s WHERE s.hidden = false AND s.useCount >= 2 ORDER BY s.useCount DESC, s.name ASC")
    List<StoreNameSuggestion> findTopVisible(Pageable pageable);

    // '!' is the escape character so a user typed % or _ matches literally.
    @Query("SELECT s FROM StoreNameSuggestion s WHERE s.hidden = false AND s.useCount >= 2 "
            + "AND s.normalizedName LIKE CONCAT('%', :escaped, '%') ESCAPE '!' "
            + "ORDER BY CASE WHEN s.normalizedName LIKE CONCAT(:escaped, '%') ESCAPE '!' THEN 0 ELSE 1 END, "
            + "s.useCount DESC, s.name ASC")
    List<StoreNameSuggestion> search(String escaped, Pageable pageable);
}
