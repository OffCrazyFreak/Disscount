package disccount.auth.service;

import disccount.auth.dao.RefreshTokenRepository;
import disccount.auth.domain.RefreshToken;
import disccount.auth.dto.*;
import disccount.exceptions.BadRequestException;
import disccount.exceptions.UnauthorizedException;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import disccount.user.domain.enums.SubscriptionTier;
import disccount.user.dto.UserDto;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        // Check if user already exists
        // If a user exists with this email but is soft-deleted, remove them and their tokens so registration can proceed
        userRepository.findByEmail(request.getEmail()).ifPresent(existing -> {
            if (existing.getDeletedAt() != null) {
                // delete any refresh tokens for that user
                refreshTokenRepository.deleteAllByUser(existing);
                // permanently delete the user
                userRepository.delete(existing);
            }
        });

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists");
        }
        

    // Validate password strength
    disccount.util.PasswordValidator.validateOrThrow(request.getPassword());

    // Create new user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .stayLoggedInDays(request.getStayLoggedInDays())
                .notificationsPush(request.getNotificationsPush())
                .notificationsEmail(request.getNotificationsEmail())
                .subscriptionTier(SubscriptionTier.FREE)
                .numberOfAiPrompts(0)
                .build();

        user = userRepository.save(user);

        // Generate tokens (use userId as JWT subject so username may be null)
        String subject = user.getId().toString();
        String accessToken = jwtService.generateAccessToken(subject, user.getId());
        String refreshToken = jwtService.generateRefreshToken(subject, user.getId());

        // Save refresh token
        saveRefreshToken(user, refreshToken);

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(convertToUserDto(user))
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by username or email
        User user = userRepository.findActiveByUsername(request.getUsernameOrEmail())
                .or(() -> userRepository.findActiveByEmail(request.getUsernameOrEmail()))
                .orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        // Check password
        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // Clean up expired tokens for this user before issuing a new token
        refreshTokenRepository.deleteExpiredTokensByUser(user, LocalDateTime.now());

    // Generate tokens (use userId as subject to support users without username)
    String subject = user.getId().toString();
    String accessToken = jwtService.generateAccessToken(subject, user.getId());
    String refreshToken = jwtService.generateRefreshToken(subject, user.getId());

        // Save refresh token
        saveRefreshToken(user, refreshToken);

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .user(convertToUserDto(user))
                .build();
    }

    public AuthResponse refreshToken(String token) {
        String tokenHash = hashToken(token);

        RefreshToken refreshTokenEntity = refreshTokenRepository
                .findActiveByTokenHash(tokenHash, LocalDateTime.now())
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        User user = refreshTokenEntity.getUser();

    // Generate new access token (use userId as subject)
    String newAccessToken = jwtService.generateAccessToken(user.getId().toString(), user.getId());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .user(convertToUserDto(user))
                .build();
    }

    public void logout(String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        // Ensure the token exists and is active before deleting.
        boolean exists = refreshTokenRepository
            .findByTokenHash(tokenHash)
            .isPresent();

        if (!exists) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        refreshTokenRepository.deleteByTokenHash(tokenHash);
    }

    public void logoutAll(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
        
        refreshTokenRepository.deleteAllByUser(user);
    }

    private void saveRefreshToken(User user, String refreshToken) {
        String tokenHash = hashToken(refreshToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(jwtService.getRefreshTokenExpiration() / 1000);

        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiresAt(expiresAt)
                .build();

        refreshTokenRepository.save(refreshTokenEntity);
    }

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes());
            return Base64.getEncoder().encodeToString(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("Error hashing token", e);
        }
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
