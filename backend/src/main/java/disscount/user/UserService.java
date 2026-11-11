package disscount.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.BadRequestException;
import disscount.shared.ConflictException;
import disscount.shared.Timestamps;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    // Coarse enough that a browsing session costs one extra write, fine enough for daily buckets.
    private static final Duration ACTIVITY_STAMP_INTERVAL = Duration.ofMinutes(5);

    // The only outcome that satisfies the onboarding gate; "skipped:<step>" is progress, not completion.
    private static final String ONBOARDING_COMPLETED = "completed";

    private final UserRepository userRepository;
    private final AuthIdentityDao authIdentityDao;
    private final UserProfileCreator profileCreator;
    private final ActiveUsers activeUsers;
    private final ApplicationEventPublisher events;
    private final ErasureLedgerRepository erasureLedger;
    private final AvatarSanitizer avatarSanitizer;

    public Optional<UserDto> findById(UUID id) {
        return userRepository.findById(id)
                .map(UserDto::from);
    }

    /** A deleted account is never revived: the login outlived a failed deletion, so the browser can finish it. */
    @Transactional
    public void ensureActiveProfile(UUID id, String email, String name, String image) {
        if (email == null) return;

        // A live profile was never erased, so the ledger stays off the hot path.
        Optional<User> existing = userRepository.findById(id);
        if (existing.isEmpty() && erasureLedger.existsById(id)) {
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
            // First user becomes admin; ledger rows count too, so a deleted first admin never re-triggers this.
            AccountType accountType = userRepository.count() + erasureLedger.count() == 0
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
                // A concurrent first login or two accounts seeding a name; the insert has its own transaction: retry.
                if (userRepository.existsById(id)) return;

                createNameless(profile, id);
            }
        }
    }

    /** Nameless rather than fail: the settings form asks for one immediately. */
    private void createNameless(User.UserBuilder profile, UUID id) {
        try {
            profileCreator.create(profile.username(null).build());
        } catch (DataIntegrityViolationException collision) {
            if (userRepository.existsById(id)) return;

            // Only the id can collide now, and a row this repository cannot see is a deleted profile with no tombstone yet.
            throw new AccountErasedException();
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

    @Transactional
    public UserDto updateProfile(UUID userId, UserRequest request) {
        User user = userRepository.requireActive(userId);

        String username = request.username();
        if (username != null && !username.equals(user.getUsername())) {
            // Checked here so the answer carries fieldErrors; the unique index catches the race with the same 409.
            if (userRepository.existsByUsername(username)) {
                throw new ConflictException("error.user.usernameTaken");
            }
            user.setUsername(username);
        }

        user.setNotificationsPushEnabledAt(applyToggle(user.getNotificationsPushEnabledAt(), request.notificationsPush()));
        user.setNotificationsEmailEnabledAt(applyToggle(user.getNotificationsEmailEnabledAt(), request.notificationsEmail()));
        user.setNewsletterEnabledAt(applyToggle(user.getNewsletterEnabledAt(), request.newsletter()));
        user.setFeedbackContactEnabledAt(applyToggle(user.getFeedbackContactEnabledAt(), request.feedbackContact()));

        if (request.acquisitionChannel() != null) {
            user.setAcquisitionChannel(request.acquisitionChannel());
        }

        // null = leave unchanged, "" = clear the avatar, otherwise store the new base64 image
        String image = request.image();
        if (image != null) {
            user.setImage(image.isEmpty() ? null : avatarSanitizer.sanitize(image));
        }

        // Only "completed" stamps it and finished is never downgraded, or a slow skipped ping could relock the flow.
        String outcome = request.onboardingOutcome();
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
        return UserDto.from(user);
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
    @Transactional
    public void deleteAccount(UUID userId) {
        // Locked so a card write racing the deletion waits and then finds a deleted user.
        userRepository.findByIdForUpdate(userId).ifPresent(user -> {
            user.setUsername(null);
            user.setImage(null);
            user.setDeletedAt(Timestamps.nowUtc());
            // Flushed now because the listeners' bulk deletes clear the persistence context, dropping any unsaved change.
            userRepository.saveAndFlush(user);
        });

        events.publishEvent(new AccountErased(userId));

        if (!erasureLedger.existsById(userId)) {
            // Flushed so a concurrent deletion's tombstone collides here, where AccountErasureService can catch it.
            erasureLedger.saveAndFlush(new ErasureLedgerEntry(userId, Timestamps.nowUtc()));
        }
    }

    public boolean isActiveAdmin(UUID userId) {
        return activeUsers.isActiveAdmin(userId);
    }

    public List<UserDto> findAllActive() {
        List<UserDto> dtos = userRepository.findAllByOrderByCreatedAtAsc()
                .stream()
                .map(UserDto::from)
                .toList();

        if (dtos.isEmpty()) {
            return dtos;
        }

        // Email and sign-in history live in better-auth's tables, so the admin list fills them: one source of truth.
        Map<UUID, AuthIdentity> identitiesById = authIdentityDao.findByUserIds(dtos.stream().map(UserDto::id).toList());
        return dtos.stream()
                .map(dto -> dto.withIdentity(identitiesById.get(dto.id())))
                .toList();
    }

    /** Identity deletion cascades sessions and accounts; the profile is only anonymized, so business data stays. */
    @Transactional
    public void deleteUserAsAdmin(UUID targetUserId, UUID adminUserId) {
        if (targetUserId.equals(adminUserId)) {
            throw new BadRequestException("error.user.cannotDeleteSelf");
        }

        // deleteAccount tolerates a missing profile for the deleteUser hook; an admin names a listed or erased user.
        if (!userRepository.existsById(targetUserId) && !erasureLedger.existsById(targetUserId)) {
            throw new BadRequestException("error.user.notFound");
        }

        authIdentityDao.deleteById(targetUserId);

        deleteAccount(targetUserId);
    }

    @Transactional
    public UserDto updateAccountType(UUID userId, AccountType accountType) {
        // The target of an admin action, not the caller: the admin's own session is fine, so no 401 here.
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadRequestException("error.user.notFound"));

        user.setAccountType(accountType);
        user = userRepository.save(user);
        return UserDto.from(user);
    }
}
