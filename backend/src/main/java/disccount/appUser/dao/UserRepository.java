package disccount.appUser.dao;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import disccount.appUser.domain.User;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    
    Optional<User> findByGoogleId(String googleId);
    
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
    
    boolean existsByUsername(String username);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.email = :email")
    Optional<User> findActiveByEmail(String email);
    
    @org.springframework.data.jpa.repository.Query("SELECT u FROM User u WHERE u.deletedAt IS NULL AND u.username = :username")
    Optional<User> findActiveByUsername(String username);
    
}

