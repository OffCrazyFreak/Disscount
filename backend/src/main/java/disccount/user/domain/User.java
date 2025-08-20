package disccount.user.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import disccount.user.domain.enums.SubscriptionTier;

@Entity
@Table(name = "app_user", uniqueConstraints = {
    @UniqueConstraint(columnNames = "username"),
    @UniqueConstraint(columnNames = "email")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Username is optional at registration; users may set it later via profile update
    @Column(nullable = true, unique = true)
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    @Column(nullable = false, unique = true)
    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "google_id")
    private String googleId;

    @Column(name = "last_login_at")
    private LocalDateTime lastLoginAt;

    @Column(name = "stay_logged_in_days", nullable = false)
    @Builder.Default
    private Integer stayLoggedInDays = 30;

    @Column(name = "notifications_push", nullable = false)
    @Builder.Default
    private Boolean notificationsPush = true;

    @Column(name = "notifications_email", nullable = false)
    @Builder.Default
    private Boolean notificationsEmail = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier", nullable = false)
    @Builder.Default
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    @Column(name = "subscription_start_date")
    private LocalDate subscriptionStartDate;

    @Column(name = "number_of_ai_prompts", nullable = false)
    @Builder.Default
    private Integer numberOfAiPrompts = 0;

    @Column(name = "last_ai_prompt_at")
    private LocalDateTime lastAiPromptAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
