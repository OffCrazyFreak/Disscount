package disccount.service;

import disccount.dao.UserRepository;
import disccount.domain.User;
import disccount.dto.auth.UserDto;
import disccount.exceptions.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

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

    public List<UserDto> findAll() {
        return userRepository.findAll().stream()
                .filter(user -> user.getDeletedAt() == null)
                .map(this::convertToUserDto)
                .collect(Collectors.toList());
    }


    public UserDto updateProfile(UUID userId, String username, Integer stayLoggedInDays, Boolean notificationsPush, Boolean notificationsEmail) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (username != null && !username.equals(user.getUsername())) {
            // Check uniqueness
            if (userRepository.existsByUsername(username)) {
                throw new disccount.exceptions.ConflictException("Username already exists");
            }
            user.setUsername(username);
        }

        if (stayLoggedInDays != null) {
            user.setStayLoggedInDays(stayLoggedInDays);
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

    public void softDeleteUser(UUID userId) {
        User user = userRepository.findById(userId)
                .filter(u -> u.getDeletedAt() == null)
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setDeletedAt(LocalDateTime.now());
        userRepository.save(user);
    }


    public boolean existsByEmail(String email) {
        return userRepository.existsByEmail(email);
    }

    public boolean existsByUsername(String username) {
        return userRepository.existsByUsername(username);
    }

    private UserDto convertToUserDto(User user) {
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .lastLoginAt(user.getLastLoginAt())
                .stayLoggedInDays(user.getStayLoggedInDays())
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
