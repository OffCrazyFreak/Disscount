package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.dto.UserDto;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    /**
     * Guarantee that an authenticated better-auth user has a usable profile.
     * Creates the profile on first contact, or revives it if it was previously
     * soft-deleted (so re-logging in is never stuck on a 404). Idempotent and
     * safe to call on every request.
     */
    public void ensureActiveProfile(UUID id, String email) {
        Optional<User> existing = userRepository.findById(id);

        if (existing.isPresent()) {
            User user = existing.get();
            boolean changed = false;

            // Safety net: if a profile is still soft-deleted/anonymized but the
            // same identity is authenticating (e.g. better-auth deletion failed
            // partway), revive it and restore the email from the token claim.
            if (user.getDeletedAt() != null) {
                user.setDeletedAt(null);
                changed = true;
            }
            if (user.getEmail() == null && email != null) {
                user.setEmail(email);
                changed = true;
            }

            if (changed) {
                userRepository.save(user);
            }

            return;
        }

        // Can't create a profile without an email.
        if (email == null) {
            return;
        }

        User user = User.builder()
                .id(id)
                .email(email)
                .build();

        userRepository.save(user);
    }

    public Optional<UserDto> findById(UUID id) {
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToUserDto);
    }

    public UserDto updateProfile(UUID userId, String username, Boolean notificationsPush, Boolean notificationsEmail) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (username != null && !username.equals(user.getUsername())) {
            // Check uniqueness
            if (userRepository.existsByUsername(username)) {
                throw new ConflictException("Username already exists");
            }
            user.setUsername(username);
        }

        if (notificationsPush != null) {
            user.setNotificationsPush(notificationsPush);
        }

        if (notificationsEmail != null) {
            user.setNotificationsEmail(notificationsEmail);
        }

        user = userRepository.save(user);
        return convertToUserDto(user);
    }

    /**
     * Delete a user's account while preserving their business data for analytics.
     * Strips PII (username + email) and marks the profile deleted, but keeps the
     * row so its shopping lists / watchlists / etc. live on as anonymized orphans.
     * The better-auth identity is deleted separately on the client, which frees
     * the email for re-registration.
     */
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setUsername(null);
        user.setEmail(null);
        user.setDeletedAt(LocalDateTime.now());

        userRepository.save(user);
    }

    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .notificationsPush(user.getNotificationsPush())
                .notificationsEmail(user.getNotificationsEmail())
                .subscriptionTier(user.getSubscriptionTier())
                .subscriptionStartDate(user.getSubscriptionStartDate())
                .numberOfAiPrompts(user.getNumberOfAiPrompts())
                .lastAiPromptAt(user.getLastAiPromptAt())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
