package disscount.user.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.domain.enums.AccountType;
import disscount.user.dto.UserDto;
import org.springframework.dao.DataIntegrityViolationException;

import disscount.exceptions.ForbiddenException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public Optional<UserDto> findById(UUID id) {
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToUserDto);
    }

    /**
     * Idempotent upsert called on every authenticated request via UserProvisioningFilter.
     * Creates the profile row on first login, or revives a soft-deleted one.
     */
    public void ensureActiveProfile(UUID id, String email, String name, String image) {
        if (email == null) return;

        Optional<User> existing = userRepository.findById(id);
        if (existing.isPresent()) {
            User user = existing.get();
            boolean changed = false;

            if (user.getDeletedAt() != null) {
                user.setDeletedAt(null);
                changed = true;
            }
            // Sync email whenever the JWT claim differs — handles provider email changes
            // and restores the field after account anonymization
            if (!email.equals(user.getEmail())) {
                user.setEmail(email);
                changed = true;
            }
            // image is intentionally not synced here: the avatar is user-owned after creation,
            // so a cleared avatar must not be repopulated from the provider on the next request
            if (changed) {
                userRepository.save(user);
            }
        } else {
            // First user to ever register becomes the platform admin; everyone else is a consumer.
            // count() includes soft-deleted rows so a deleted admin never re-triggers auto-promotion.
            AccountType accountType = userRepository.count() == 0
                    ? AccountType.ADMIN
                    : AccountType.CONSUMER;
            String username = seedUsername(name, email);
            try {
                userRepository.save(User.builder()
                        .id(id)
                        .email(email)
                        .username(username)
                        .image(image)
                        .accountType(accountType)
                        .build());
            } catch (DataIntegrityViolationException ignored) {
                // Concurrent first-login race: the other request won — profile already exists
            }
        }
    }

    /**
     * Seeds a username for a brand-new profile from the provider display name,
     * falling back to the email local-part when the name is missing.
     * Usernames are not unique, so no de-duplication is needed.
     */
    private String seedUsername(String name, String email) {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }

        String localPart = email.split("@")[0];
        return localPart.isBlank() ? null : localPart;
    }

    public UserDto updateProfile(UUID userId, String username, Boolean notificationsPush, Boolean notificationsEmail, String image) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (username != null && !username.equals(user.getUsername())) {
            user.setUsername(username);
        }

        if (notificationsPush != null) {
            user.setNotificationsPush(notificationsPush);
        }
        if (notificationsEmail != null) {
            user.setNotificationsEmail(notificationsEmail);
        }

        // null = leave unchanged, "" = clear the avatar, otherwise store the new base64 image
        if (image != null) {
            user.setImage(image.isEmpty() ? null : image);
        }

        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    /**
     * Anonymizes the profile: nulls PII fields and soft-deletes.
     * The row is kept so business data (watchlists, shopping lists, etc.) remains intact.
     * better-auth identity must be deleted separately via authClient.deleteUser() on the frontend.
     */
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setUsername(null);
        user.setEmail(null);
        user.setImage(null);
        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }

    /**
     * Throws unless the given user is an active ADMIN. Used to gate admin-only endpoints.
     */
    public void requireAdmin(UUID userId) {
        boolean isAdmin = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .map(u -> u.getAccountType() == AccountType.ADMIN)
                .orElse(false);

        if (!isAdmin) {
            throw new ForbiddenException("Admin access required");
        }
    }

    public List<UserDto> findAllActive() {
        return userRepository.findByDeletedAtIsNullOrderByCreatedAtAsc()
                .stream()
                .map(this::convertToUserDto)
                .toList();
    }

    /**
     * Fully removes another user (admin action): deletes the better-auth identity — which
     * cascades its sessions/accounts — then anonymizes and soft-deletes the profile row so
     * business data stays intact. better-auth shares this database, so the identity is removed
     * directly via a native delete.
     */
    public void deleteUserAsAdmin(UUID targetUserId, UUID adminUserId) {
        if (targetUserId.equals(adminUserId)) {
            throw new BadRequestException("You cannot delete your own account from the admin panel");
        }

        entityManager.createNativeQuery("DELETE FROM \"user\" WHERE id = :id")
                .setParameter("id", targetUserId)
                .executeUpdate();

        deleteAccount(targetUserId);
    }

    public UserDto updateAccountType(UUID userId, AccountType accountType) {
        if (accountType == null) {
            throw new BadRequestException("Account type is required");
        }

        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setAccountType(accountType);
        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .notificationsPush(user.getNotificationsPush())
                .notificationsEmail(user.getNotificationsEmail())
                .image(user.getImage())
                .accountType(user.getAccountType())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
