package disscount.user.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import disscount.user.domain.User;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    List<User> findByDeletedAtIsNullOrderByCreatedAtAsc();

    /**
     * Spans soft-deleted rows too, matching the unique index, which does not care that an
     * account is gone. In practice they never collide: deleteAccount nulls the username,
     * which is what frees the name for somebody else.
     */
    boolean existsByUsername(String username);
}
