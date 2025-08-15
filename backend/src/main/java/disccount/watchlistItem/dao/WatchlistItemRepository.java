package disccount.watchlistItem.dao;

import disccount.watchlistItem.domain.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, UUID> {

    @Query("SELECT w FROM WatchlistItem w WHERE w.user.id = :userId AND w.deletedAt IS NULL")
    List<WatchlistItem> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT w FROM WatchlistItem w WHERE w.productApiId = :productApiId AND w.user.id = :userId AND w.deletedAt IS NULL")
    Optional<WatchlistItem> findByProductApiId(@Param("productApiId") String productApiId, @Param("userId") UUID userId);
}
