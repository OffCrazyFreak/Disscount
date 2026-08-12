package disscount.storeName.dao;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disscount.storeName.domain.StoreNameSuggestion;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface StoreNameSuggestionRepository extends JpaRepository<StoreNameSuggestion, UUID> {

    Optional<StoreNameSuggestion> findByNormalizedName(String normalizedName);

    @Query("SELECT s FROM StoreNameSuggestion s WHERE s.hiddenAt IS NULL AND s.usageCount >= :minUsage ORDER BY s.usageCount DESC, s.name ASC")
    List<StoreNameSuggestion> findVisible(int minUsage, Pageable pageable);
}
