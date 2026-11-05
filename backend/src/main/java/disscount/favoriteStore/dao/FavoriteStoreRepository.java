package disscount.favoriteStore.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import disscount.favoriteStore.domain.FavoriteStore;

import java.util.List;
import java.util.UUID;

@Repository
public interface FavoriteStoreRepository extends JpaRepository<FavoriteStore, UUID> {

    @Query("SELECT fs FROM FavoriteStore fs WHERE fs.user.id = :userId")
    List<FavoriteStore> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM FavoriteStore fs WHERE fs.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
