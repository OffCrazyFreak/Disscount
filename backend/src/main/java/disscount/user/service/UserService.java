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
import disscount.user.dto.AuthIdentity;
import disscount.user.dto.UserDto;
import disscount.user.dto.UserRequest;
import org.springframework.dao.DataIntegrityViolationException;

import disscount.exceptions.ForbiddenException;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    // Coarse enough that a browsing session costs one extra write, fine enough for daily buckets.
    private static final Duration ACTIVITY_STAMP_INTERVAL = Duration.ofMinutes(5);

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
            if (isActivityStampStale(user.getLastActiveAt())) {
                user.setLastActiveAt(LocalDateTime.now());
                changed = true;
            }
            // Email is no longer mirrored here: it lives authoritatively in the better-auth `user`
            // table, and the backend reads it from there (admin list) or the session (current user).
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
            // Every switch starts ON; the stamped timestamp is what the settings form reads back.
            LocalDateTime now = LocalDateTime.now();
            try {
                userRepository.save(User.builder()
                        .id(id)
                        .username(username)
                        .image(image)
                        .accountType(accountType)
                        .notificationsPushEnabledAt(now)
                        .notificationsEmailEnabledAt(now)
                        .newsletterEnabledAt(now)
                        .feedbackContactEnabledAt(now)
                        .lastActiveAt(now)
                        .build());
            } catch (DataIntegrityViolationException ignored) {
                // Concurrent first-login race: the other request won - profile already exists
            }
        }
    }

    private boolean isActivityStampStale(LocalDateTime lastActiveAt) {
        return lastActiveAt == null
                || lastActiveAt.isBefore(LocalDateTime.now().minus(ACTIVITY_STAMP_INTERVAL));
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

    public UserDto updateProfile(UUID userId, UserRequest request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String username = request.getUsername();
        if (username != null && !username.equals(user.getUsername())) {
            user.setUsername(username);
        }

        user.setNotificationsPushEnabledAt(applyToggle(user.getNotificationsPushEnabledAt(), request.getNotificationsPush()));
        user.setNotificationsEmailEnabledAt(applyToggle(user.getNotificationsEmailEnabledAt(), request.getNotificationsEmail()));
        user.setNewsletterEnabledAt(applyToggle(user.getNewsletterEnabledAt(), request.getNewsletter()));
        user.setFeedbackContactEnabledAt(applyToggle(user.getFeedbackContactEnabledAt(), request.getFeedbackContact()));

        if (request.getAcquisitionChannel() != null) {
            user.setAcquisitionChannel(request.getAcquisitionChannel());
        }

        // null = leave unchanged, "" = clear the avatar, otherwise store the new base64 image
        String image = request.getImage();
        if (image != null) {
            user.setImage(image.isEmpty() ? null : image);
        }

        // Outcome may be overwritten by re-running the wizard, but the completion
        // timestamp keeps its original value so "first finished" stays meaningful.
        if (request.getOnboardingOutcome() != null) {
            user.setOnboardingOutcome(request.getOnboardingOutcome());
            if (user.getOnboardingCompletedAt() == null) {
                user.setOnboardingCompletedAt(LocalDateTime.now());
            }
        }

        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    /**
     * Translates a desired on/off switch state into the stored timestamp:
     * null = leave unchanged, true = set now() only if currently off (preserve the original
     * enable time), false = clear.
     */
    private LocalDateTime applyToggle(LocalDateTime current, Boolean desired) {
        if (desired == null) {
            return current;
        }
        if (desired) {
            return current != null ? current : LocalDateTime.now();
        }
        return null;
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
        List<UserDto> dtos = userRepository.findByDeletedAtIsNullOrderByCreatedAtAsc()
                .stream()
                .map(this::convertToUserDto)
                .toList();

        // Email and sign-in history live in the better-auth tables (shared DB), not in app_user.
        // Populate them here so the admin list still shows them, keeping a single source of truth.
        if (!dtos.isEmpty()) {
            Map<UUID, AuthIdentity> identitiesById = fetchAuthIdentities(dtos.stream().map(UserDto::getId).toList());
            dtos.forEach(dto -> applyAuthIdentity(dto, identitiesById.get(dto.getId())));
        }

        return dtos;
    }

    private void applyAuthIdentity(UserDto dto, AuthIdentity identity) {
        if (identity == null) return;

        dto.setEmail(identity.email());
        dto.setLastLoginAt(identity.lastLoginAt());
        // The stamped column only starts at this feature's rollout, so surviving session rows
        // fill in the history behind it.
        dto.setLastActiveAt(latestOf(dto.getLastActiveAt(), identity.lastSeenAt()));
    }

    private LocalDateTime latestOf(LocalDateTime first, LocalDateTime second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }

    @SuppressWarnings("unchecked")
    private Map<UUID, AuthIdentity> fetchAuthIdentities(List<UUID> ids) {
        List<Object[]> rows = entityManager
                .createNativeQuery("""
                        SELECT u.id, u.email, MAX(s.created_at), MAX(s.updated_at)
                        FROM "user" u
                        LEFT JOIN "session" s ON s.user_id = u.id
                        WHERE u.id IN (:ids)
                        GROUP BY u.id, u.email
                        """)
                .setParameter("ids", ids)
                .getResultList();

        Map<UUID, AuthIdentity> identitiesById = new HashMap<>();
        for (Object[] row : rows) {
            identitiesById.put(
                    (UUID) row[0],
                    new AuthIdentity((String) row[1], toLocalDateTime(row[2]), toLocalDateTime(row[3]))
            );
        }
        return identitiesById;
    }

    // Native aggregates come back as Timestamp on some drivers and LocalDateTime on others.
    private LocalDateTime toLocalDateTime(Object value) {
        if (value instanceof Timestamp timestamp) return timestamp.toLocalDateTime();
        if (value instanceof LocalDateTime localDateTime) return localDateTime;
        return null;
    }

    /**
     * Fully removes another user (admin action): deletes the better-auth identity - which
     * cascades its sessions/accounts - then anonymizes and soft-deletes the profile row so
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
        // email is intentionally omitted: the current user reads it from the better-auth session,
        // and the admin list backfills it from the better-auth `user` table (see findAllActive).
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .notificationsPushEnabledAt(user.getNotificationsPushEnabledAt())
                .notificationsEmailEnabledAt(user.getNotificationsEmailEnabledAt())
                .newsletterEnabledAt(user.getNewsletterEnabledAt())
                .feedbackContactEnabledAt(user.getFeedbackContactEnabledAt())
                .acquisitionChannel(user.getAcquisitionChannel())
                .image(user.getImage())
                .onboardingCompletedAt(user.getOnboardingCompletedAt())
                .onboardingOutcome(user.getOnboardingOutcome())
                .accountType(user.getAccountType())
                .createdAt(user.getCreatedAt())
                .lastActiveAt(user.getLastActiveAt())
                .build();
    }
}
