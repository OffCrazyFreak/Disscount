package disccount.pinnedPlace.dao;

import disccount.pinnedPlace.domain.PinnedPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PinnedPlaceRepository extends JpaRepository<PinnedPlace, UUID> {

    @Query("SELECT pp FROM PinnedPlace pp WHERE pp.user.id = :userId")
    List<PinnedPlace> findByUserId(@Param("userId") UUID userId);
}
