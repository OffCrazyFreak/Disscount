package disscount.digitalCard.dao;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import disscount.digitalCard.domain.PhotoCleanup;

import java.util.List;
import java.util.UUID;

@Repository
public interface PhotoCleanupRepository extends JpaRepository<PhotoCleanup, UUID> {

    @Query("SELECT p FROM PhotoCleanup p ORDER BY p.createdAt ASC")
    List<PhotoCleanup> findOldest(Pageable pageable);

    // REQUIRES_NEW because this runs from an afterCommit callback, where joining the finished transaction would never commit.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Modifying
    @Query("DELETE FROM PhotoCleanup p WHERE p.id = :id")
    void removeById(UUID id);
}
