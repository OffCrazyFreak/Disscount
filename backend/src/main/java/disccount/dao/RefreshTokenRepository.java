package disccount.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import disccount.domain.RefreshToken;
import disccount.domain.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = :user AND rt.expiresAt > :now")
    List<RefreshToken> findActiveTokensByUser(User user, LocalDateTime now);

    @Query("SELECT rt FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash AND rt.expiresAt > :now")
    Optional<RefreshToken> findActiveByTokenHash(String tokenHash, LocalDateTime now);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user")
    void deleteAllByUser(User user);

    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.tokenHash = :tokenHash")
    void deleteByTokenHash(String tokenHash);


    @Modifying
    @Query("DELETE FROM RefreshToken rt WHERE rt.user = :user AND rt.expiresAt <= :now")
    void deleteExpiredTokensByUser(User user, LocalDateTime now);

    @Query("SELECT COUNT(rt) FROM RefreshToken rt WHERE rt.user = :user AND rt.expiresAt > :now")
    long countActiveTokensByUser(User user, LocalDateTime now);
}
