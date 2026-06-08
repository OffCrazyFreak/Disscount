package disscount.user.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.enums.SubscriptionTier;

/**
 * Business profile for a user. Identity (credentials, email verification, OAuth
 * accounts, sessions) is owned by better-auth in its own tables. The id here is
 * the SAME id better-auth generates (a UUID), so all existing foreign keys keep
 * referencing this row. The profile is created lazily on first authenticated
 * request (see UserProvisioningFilter).
 */
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

    // Assigned from the better-auth user id (not generated here).
    @Id
    private UUID id;

    // Username is optional; users may set it later via profile update.
    @Column(nullable = true, unique = true)
    private String username;

    // Denormalized from the better-auth identity for display/convenience.
    // Nullable because account deletion nulls PII (username + email) while
    // keeping the row + its business data as an anonymized orphan.
    @Email(message = "Email should be valid")
    @Column(nullable = true, unique = true)
    private String email;

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
