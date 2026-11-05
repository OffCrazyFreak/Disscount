package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.digitalCard.service.DigitalCardService;
import disscount.favoriteStore.service.FavoriteStoreService;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.productImage.service.ProductImageErasure;
import disscount.user.avatar.AvatarSanitizer;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.ErasureLedgerRepository;
import disscount.user.dao.UserRepository;
import disscount.user.domain.ErasureLedgerEntry;
import disscount.user.domain.User;
import disscount.user.domain.enums.AccountType;
import disscount.user.dto.AuthIdentity;
import disscount.user.dto.UserDto;
import disscount.user.dto.UserRequest;
import org.springframework.dao.DataIntegrityViolationException;

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
    private final UserProfileCreator profileCreator;
    private final DigitalCardService digitalCardService;
    private final FavoriteStoreService favoriteStoreService;
    private final ProductImageErasure productImageErasure;
    private final ErasureLedgerRepository erasureLedger;
    private final AvatarSanitizer avatarSanitizer;

    // Read-only, or the class-level @Transactional would keep a dirty-checking flush for a query that never writes.
    @Transactional(readOnly = true)
    public Optional<UserDto> findById(UUID id) {
        return userRepository.findByIdAndDeletedAtIsNull(id)
                .map(this::convertToUserDto);
    }

    /** A deleted account is never revived: the login outlived a failed deletion, so the browser can finish it. */
    public void ensureActiveProfile(UUID id, String email, String name, String image) {
        if (email == null) return;

        Optional<User> existing = userRepository.findById(id);
        // Profiles deleted before the ledger have no tombstone, so the row is proof; the ledger is off the hot path.
        boolean isErased = existing
                .map(user -> user.getDeletedAt() != null)
                .orElseGet(() -> erasureLedger.existsById(id));
        if (isErased) {
            throw new AccountErasedException();
        }

        if (existing.isPresent()) {
            User user = existing.get();

            // Email lives in better-auth's `user` table; image is unsynced, so a cleared avatar stays cleared.
            if (isActivityStampStale(user.getLastActiveAt())) {
                user.setLastActiveAt(Timestamps.nowUtc());
                userRepository.save(user);
            }
        } else {
            // First user becomes admin; count() includes soft-deleted rows so a deleted admin never re-triggers this.
            AccountType accountType = userRepository.count() == 0
                    ? AccountType.ADMIN
                    : AccountType.CONSUMER;
            String username = seedUsername(name, email);
            // Null as marketing needs opt-in, and a pre-set switch is not consent (GDPR Recital 32, ZEK Art. 50).
            LocalDateTime now = Timestamps.nowUtc();
            User.UserBuilder profile = User.builder()
                    .id(id)
                    .image(image)
                    .accountType(accountType)
                    .notificationsPushEnabledAt(now)
                    .notificationsEmailEnabledAt(now)
                    .feedbackContactEnabledAt(now)
                    .lastActiveAt(now);

            try {
                profileCreator.create(profile.username(username).build());
            } catch (DataIntegrityViolationException collision) {
                // A concurrent first login or shared username seed; the insert ran apart, so this can retry.
                if (userRepository.existsById(id)) return;

                // Nameless rather than fail: the settings form asks for one immediately.
                profileCreator.create(profile.username(null).build());
            }
        }
    }

    private boolean isActivityStampStale(LocalDateTime lastActiveAt) {
        return lastActiveAt == null
                || lastActiveAt.isBefore(Timestamps.nowUtc().minus(ACTIVITY_STAMP_INTERVAL));
    }

    /** Suffixes on a collision as nobody is present to choose on first login; the user-facing edit refuses instead. */
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

        // Bounded: past the cap a null name beats a slow loop, and the form will ask.
        for (int suffix = 1; suffix <= 100; suffix++) {
            String candidate = base + suffix;
            if (!userRepository.existsByUsername(candidate)) {
                return candidate;
            }
        }

        return null;
    }

    public UserDto updateProfile(UUID userId, UserRequest request) {
        User user = userRepository.requireActive(userId);

        String username = request.getUsername();
        if (username != null && !username.equals(user.getUsername())) {
            // Checked here so the answer carries fieldErrors; the unique index catches the race with the same 409.
            if (userRepository.existsByUsername(username)) {
                throw new ConflictException("error.user.usernameTaken");
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
            user.setImage(image.isEmpty() ? null : avatarSanitizer.sanitize(image));
        }

        // Only "completed" stamps it and finished is never downgraded, or a slow skipped ping could relock the flow.
        String outcome = request.getOnboardingOutcome();
        boolean isDowngrade = outcome != null
                && !ONBOARDING_COMPLETED.equals(outcome)
                && ONBOARDING_COMPLETED.equals(user.getOnboardingOutcome());

        if (outcome != null && !isDowngrade) {
            user.setOnboardingOutcome(outcome);
            if (ONBOARDING_COMPLETED.equals(outcome)
                    && user.getOnboardingCompletedAt() == null) {
                user.setOnboardingCompletedAt(Timestamps.nowUtc());
            }
        }

        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    /** null leaves it unchanged, true sets now only if off, preserving the first enable time, and false clears. */
    private LocalDateTime applyToggle(LocalDateTime current, Boolean desired) {
        if (desired == null) {
            return current;
        }
        if (desired) {
            return current != null ? current : Timestamps.nowUtc();
        }
        return null;
    }

    /** Idempotent and fine with no profile, as better-auth's beforeDelete calls it and a refusal blocks deletion. */
    public void deleteAccount(UUID userId) {
        // Locked so a card write racing the deletion waits and then finds a deleted user.
        userRepository.findByIdForUpdate(userId).ifPresent(user -> {
            user.setUsername(null);
            user.setImage(null);
            user.setDeletedAt(Timestamps.nowUtc());
            // Flushed now because the card purge below clears the persistence context, dropping any unsaved change.
            userRepository.saveAndFlush(user);
        });

        // Cards hold card numbers and photos, which must not outlive the account.
        digitalCardService.deleteAllForUser(userId);
        // Favourite stores show where the person shops.
        favoriteStoreService.deleteAllForUser(userId);
        // Unconfirmed photos and private originals may show the person or their home.
        productImageErasure.eraseContributor(userId);

        if (!erasureLedger.existsById(userId)) {
            // Flushed so a concurrent deletion's tombstone collides here, where AccountErasureService can catch it.
            erasureLedger.saveAndFlush(new ErasureLedgerEntry(userId, Timestamps.nowUtc()));
        }
    }

    /** Locks the caller's profile until commit, so a write racing account deletion lands first or is refused. */
    public void lockActive(UUID userId) {
        userRepository.requireActiveForUpdate(userId);
    }

    public boolean isActiveAdmin(UUID userId) {
        return userRepository.findByIdAndDeletedAtIsNull(userId)
                .map(u -> u.getAccountType() == AccountType.ADMIN)
                .orElse(false);
    }

    @Transactional(readOnly = true)
    public List<UserDto> findAllActive() {
        List<UserDto> dtos = userRepository.findByDeletedAtIsNullOrderByCreatedAtAsc()
                .stream()
                .map(this::convertToUserDto)
                .toList();

        // Email and sign-in history live in better-auth's tables, so the admin list fills them: one source of truth.
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
        // The stamped column starts at this feature's rollout, so surviving session rows fill in the history behind it.
        dto.setLastActiveAt(latestOf(dto.getLastActiveAt(), identity.lastSeenAt()));
    }

    private Instant latestOf(Instant first, Instant second) {
        if (first == null) return second;
        if (second == null) return first;
        return first.isAfter(second) ? first : second;
    }

    /** Identity deletion cascades sessions and accounts; the profile is only anonymized, so business data stays. */
    public void deleteUserAsAdmin(UUID targetUserId, UUID adminUserId) {
        if (targetUserId.equals(adminUserId)) {
            throw new BadRequestException("error.user.cannotDeleteSelf");
        }

        // deleteAccount tolerates a missing profile for the deleteUser hook; an admin names a listed user.
        if (!userRepository.existsById(targetUserId)) {
            throw new BadRequestException("error.user.notFound");
        }

        authIdentityDao.deleteById(targetUserId);

        deleteAccount(targetUserId);
    }

    public UserDto updateAccountType(UUID userId, AccountType accountType) {
        // The target of an admin action, not the caller: the admin's own session is fine, so no 401 here.
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new BadRequestException("error.user.notFound"));

        user.setAccountType(accountType);
        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    private UserDto convertToUserDto(User user) {
        // No email: the current user reads the session, and the admin list backfills it (see findAllActive).
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

    // The column is zone-less but written by Timestamps.nowUtc(), so UTC is the offset it was stamped with.
    private Instant toUtcInstant(LocalDateTime value) {
        return value == null ? null : value.toInstant(ZoneOffset.UTC);
    }
}
