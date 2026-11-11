package disscount.preferences;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
interface PinnedPlaceRepository extends JpaRepository<PinnedPlace, UUID> {

    @Query("SELECT pp FROM PinnedPlace pp WHERE pp.userId = :userId")
    List<PinnedPlace> findByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query("DELETE FROM PinnedPlace pp WHERE pp.userId = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
