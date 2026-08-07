package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.domain.enums.AccountType;
import disscount.user.dto.AuthIdentity;
import disscount.user.dto.UserDto;
import disscount.user.dto.UserRequest;
import org.springframework.dao.DataIntegrityViolationException;

import disscount.exceptions.ForbiddenException;
import disscount.util.Timestamps;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
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

    // The only outcome that satisfies the onboarding gate; "skipped:<step>" is progress, not completion.
    private static final String ONBOARDING_COMPLETED = "completed";

    private final UserRepository userRepository;
    private final AuthIdentityDao authIdentityDao;

    // Compared against better-auth's UTC session timestamps, so the JVM zone must not leak in.
    private static LocalDateTime nowUtc() {
        return Timestamps.nowUtc();
    }

    // Read-only: the class-level @Transactional would otherwise keep a dirty-checking
    // flush at commit for a query that never writes.
    @Transactional(readOnly = true)
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
                user.setLastActiveAt(nowUtc());
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
            LocalDateTime now = nowUtc();
            try {
                // saveAndFlush, not save. The id is assigned rather than generated, so
                // save() merges: Hibernate queues the insert and executes it when the
                // transaction commits, which is after this method returns and after this
                // catch is out of scope. The violation then escapes into
                // UserProvisioningFilter and becomes a 500 on whatever request happened to
                // be the user's first. Flushing here puts it back where it can be handled.
                userRepository.saveAndFlush(User.builder()
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
            } catch (DataIntegrityViolationException collision) {
                // Either a concurrent first login for the same account, where the other
                // request won and the profile now exists, or two new accounts seeding the
                // same username at once, since seedUsername checks and inserts without a
                // lock. Retry once without a username rather than failing the request: the
                // settings form requires one before anything else saves, so the user is
                // asked for it immediately anyway.
                userRepository.saveAndFlush(User.builder()
                        .id(id)
                        .image(image)
                        .accountType(accountType)
                        .notificationsPushEnabledAt(now)
                        .notificationsEmailEnabledAt(now)
                        .newsletterEnabledAt(now)
                        .feedbackContactEnabledAt(now)
                        .lastActiveAt(now)
                        .build());
            }
        }
    }

    private boolean isActivityStampStale(LocalDateTime lastActiveAt) {
        return lastActiveAt == null
                || lastActiveAt.isBefore(nowUtc().minus(ACTIVITY_STAMP_INTERVAL));
    }

    /**
     * Seeds a username for a brand-new profile from the provider display name, falling back
     * to the email local-part when the name is missing.
     *
     * <p>De-duplicates with a numeric suffix, because usernames are unique now and the
     * sources collide readily: two Google accounts both called "Ivan Horvat", or
     * ivan@gmail.com and ivan@yahoo.com both seeding "ivan". Nobody is present to choose at
     * this point, so a suffix is the only answer that does not fail the first login. The
     * user-facing edit path refuses a taken name instead, where there is somebody to ask.
     */
    private String seedUsername(String name, String email) {
        String base = (name != null && !name.isBlank())
                ? name.trim()
                : email.split("@")[0];

        if (base.isBlank()) {
            return null;
        }

        if (!userRepository.existsByUsername(base)) {
            return base;
        }

        // Bounded: past the cap a null username is better than a slow loop, and the user
        // can set one themselves. The settings form requires it before anything else saves.
        for (int suffix = 1; suffix <= 100; suffix++) {
            String candidate = base + suffix;
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    public UserDto updateProfile(UUID userId, UserRequest request) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String username = request.getUsername();
        if (username != null && !username.equals(user.getUsername())) {
            // Checked rather than left to the unique index so the answer is a 409 carrying
            // fieldErrors, which the settings form puts on the username field itself. Two
            // requests can still both pass this check, in which case the index refuses one
            // and GlobalExceptionHandler renders the same 409 -- but only if the index
            // actually exists. ddl-auto=update will not add it to a table that already
            // holds duplicates, and it logs the failure rather than refusing to start, so
            // the index has to be created by hand. See docs/AUTH.md.
            if (userRepository.existsByUsername(username)) {
                throw new ConflictException("Korisničko ime je već zauzeto.");
            }
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
        // Only "completed" stamps it: the wizard writes "skipped:<step>" on every
        // advance so progress survives a reload, and those must not count as finishing.
        // A finished account is never downgraded. The wizard fires progress pings
        // without awaiting them, so a slow "skipped:<step>" can arrive after the
        // completion it raced and would otherwise lock the user back into the
        // uncloseable required flow. The client guards this too; this is the copy
        // that survives a stale tab or a replayed request.
        String outcome = request.getOnboardingOutcome();
        boolean isDowngrade = outcome != null
                && !ONBOARDING_COMPLETED.equals(outcome)
                && ONBOARDING_COMPLETED.equals(user.getOnboardingOutcome());

        if (outcome != null && !isDowngrade) {
            user.setOnboardingOutcome(outcome);
            if (ONBOARDING_COMPLETED.equals(outcome)
                    && user.getOnboardingCompletedAt() == null) {
                user.setOnboardingCompletedAt(nowUtc());
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
            return current != null ? current : nowUtc();
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
        user.setDeletedAt(nowUtc());
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

    @Transactional(readOnly = true)
    public List<UserDto> findAllActive() {
        List<UserDto> dtos = userRepository.findByDeletedAtIsNullOrderByCreatedAtAsc()
                .stream()
                .map(this::convertToUserDto)
                .toList();

        // Email and sign-in history live in the better-auth tables (shared DB), not in app_user.
        // Populate them here so the admin list still shows them, keeping a single source of truth.
        if (!dtos.isEmpty()) {
            Map<UUID, AuthIdentity> identitiesById = authIdentityDao.findByUserIds(dtos.stream().map(UserDto::getId).toList());
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

    private Instant latestOf(Instant first, Instant second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }

    /**
     * Fully removes another user (admin action): deletes the better-auth identity - which
     * cascades its sessions/accounts - then anonymizes and soft-deletes the profile row so
     * business data stays intact.
     */
    public void deleteUserAsAdmin(UUID targetUserId, UUID adminUserId) {
        if (targetUserId.equals(adminUserId)) {
            throw new BadRequestException("You cannot delete your own account from the admin panel");
        }

        authIdentityDao.deleteById(targetUserId);

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
                .lastActiveAt(toUtcInstant(user.getLastActiveAt()))
                .build();
    }

    // The column is zone-less but written by nowUtc(), so UTC is the offset it was stamped with.
    private Instant toUtcInstant(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
