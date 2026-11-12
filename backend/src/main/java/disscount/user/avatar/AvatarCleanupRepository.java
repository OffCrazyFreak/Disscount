package disscount.user.avatar;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Repository
interface AvatarCleanupRepository extends JpaRepository<AvatarCleanup, UUID> {

    @Query("SELECT c FROM AvatarCleanup c ORDER BY c.createdAt ASC")
    List<AvatarCleanup> findOldest(Pageable pageable);

    // REQUIRES_NEW because an afterCommit callback joining the finished transaction would never commit.
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    @Modifying
    @Query("DELETE FROM AvatarCleanup c WHERE c.id = :id")
    void removeById(UUID id);
}
