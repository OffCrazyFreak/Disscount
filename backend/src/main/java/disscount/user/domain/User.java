package disscount.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.enums.SubscriptionTier;

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

    // ID is assigned externally by better-auth (same UUID as the better-auth `user.id`)
    @Id
    private UUID id;

    @Column(nullable = true, unique = true)
    private String username;

    // Nullable: email is nulled during account deletion to free it for re-registration
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
