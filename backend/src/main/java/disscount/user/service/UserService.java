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

    public Optional<UserDto> findById(UUID id) {
        return userRepository.findById(id)
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToUserDto);
    }

    /**
     * Idempotent upsert called on every authenticated request via UserProvisioningFilter.
     * Creates the profile row on first login, or revives a soft-deleted one.
     */
    public void ensureActiveProfile(UUID id, String email) {
        if (email == null) return;

        Optional<User> existing = userRepository.findById(id);
        if (existing.isPresent()) {
            User user = existing.get();
            boolean changed = false;

            if (user.getDeletedAt() != null) {
                user.setDeletedAt(null);
                changed = true;
            }
            if (user.getEmail() == null) {
                user.setEmail(email);
                changed = true;
            }
            if (changed) {
                userRepository.save(user);
            }
        } else {
            userRepository.save(User.builder().id(id).email(email).build());
        }
    }

    public UserDto updateProfile(UUID userId, String username, Boolean notificationsPush, Boolean notificationsEmail) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (username != null && !username.equals(user.getUsername())) {
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
     * Anonymizes the profile: nulls PII fields and soft-deletes.
     * The row is kept so business data (watchlists, shopping lists, etc.) remains intact.
     * better-auth identity must be deleted separately via authClient.deleteUser() on the frontend.
     */
    public void deleteAccount(UUID userId) {
        User user = userRepository.findById(userId)
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
