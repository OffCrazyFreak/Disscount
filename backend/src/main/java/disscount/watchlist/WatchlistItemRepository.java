package disscount.watchlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, UUID> {

    @Query("SELECT w FROM WatchlistItem w WHERE w.userId = :userId")
    List<WatchlistItem> findByUserId(@Param("userId") UUID userId);

    // Owner-scoped so a stranger's item looks missing; native so deleted rows still match and a repeat delete stays 204.
    @Query(value = "SELECT * FROM watchlist_item WHERE id = :id AND user_id = :userId", nativeQuery = true)
    Optional<WatchlistItem> findIncludingDeletedByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query(value = "SELECT COUNT(*) > 0 FROM watchlist_item WHERE id = :id AND user_id = :userId", nativeQuery = true)
    boolean existsIncludingDeletedByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT w FROM WatchlistItem w WHERE w.productApiId = :productApiId AND w.userId = :userId")
    List<WatchlistItem> findByProductApiId(@Param("productApiId") String productApiId, @Param("userId") UUID userId);

    @Query("SELECT w FROM WatchlistItem w WHERE w.productApiId = :productApiId AND w.watchType = :watchType AND w.userId = :userId")
    Optional<WatchlistItem> findByProductApiIdAndWatchType(
        @Param("productApiId") String productApiId, 
        @Param("watchType") WatchType watchType, 
        @Param("userId") UUID userId
    );
}
