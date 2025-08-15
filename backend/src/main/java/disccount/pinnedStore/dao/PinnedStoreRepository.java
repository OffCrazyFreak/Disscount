package disccount.pinnedStore.dao;

import disccount.pinnedStore.domain.PinnedStore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PinnedStoreRepository extends JpaRepository<PinnedStore, UUID> {

    @Query("SELECT ps FROM PinnedStore ps WHERE ps.user.id = :userId AND ps.deletedAt IS NULL ORDER BY ps.createdAt ASC")
    List<PinnedStore> findByUserId(@Param("userId") UUID userId);
}
