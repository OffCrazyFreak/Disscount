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

    @Query("SELECT w FROM WatchlistItem w WHERE w.user.id = :userId AND w.deletedAt IS NULL")
    List<WatchlistItem> findByUserId(@Param("userId") UUID userId);

    // Owner-scoped so a stranger's item looks missing; deleted rows still match so a repeat delete stays 204.
    @Query("SELECT w FROM WatchlistItem w WHERE w.id = :id AND w.user.id = :userId")
    Optional<WatchlistItem> findByIdAndUserId(@Param("id") UUID id, @Param("userId") UUID userId);

    @Query("SELECT w FROM WatchlistItem w WHERE w.productApiId = :productApiId AND w.user.id = :userId AND w.deletedAt IS NULL")
    List<WatchlistItem> findByProductApiId(@Param("productApiId") String productApiId, @Param("userId") UUID userId);

    @Query("SELECT w FROM WatchlistItem w WHERE w.productApiId = :productApiId AND w.watchType = :watchType AND w.user.id = :userId AND w.deletedAt IS NULL")
    Optional<WatchlistItem> findByProductApiIdAndWatchType(
        @Param("productApiId") String productApiId, 
        @Param("watchType") WatchType watchType, 
        @Param("userId") UUID userId
    );
}
