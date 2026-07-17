package disscount.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.enums.AccountType;
import disscount.user.domain.enums.AcquisitionChannel;

@Entity
@Table(name = "app_user")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    // ID is assigned externally by better-auth (same UUID as the better-auth `user.id`)
    @Id
    private UUID id;

    @Column(nullable = true)
    private String username;

    // Preference toggles are stored as timestamps instead of booleans: null = off,
    // non-null = on AND when it was last switched on (lightweight usage stat without an event log).
    @Column(name = "notifications_push_enabled_at")
    private LocalDateTime notificationsPushEnabledAt;

    @Column(name = "notifications_email_enabled_at")
    private LocalDateTime notificationsEmailEnabledAt;

    // Marketing consents — default OFF (null) per GDPR opt-in.
    @Column(name = "newsletter_enabled_at")
    private LocalDateTime newsletterEnabledAt;

    @Column(name = "feedback_contact_enabled_at")
    private LocalDateTime feedbackContactEnabledAt;

    // How the user first heard about Disscount; null until they answer in the profile modal.
    @Enumerated(EnumType.STRING)
    @Column(name = "acquisition_channel")
    private AcquisitionChannel acquisitionChannel;

    // Base64 avatar; Google sign-ins use the session image instead, so this stays null unless uploaded.
    @Column(name = "image", columnDefinition = "TEXT")
    private String image;

    // Stamped when the onboarding wizard ends, however it ends; null = wizard auto-opens on load.
    @Column(name = "onboarding_completed_at")
    private LocalDateTime onboardingCompletedAt;

    // How onboarding ended: "completed" or "skipped:<step>" (step index where the user bailed).
    @Column(name = "onboarding_outcome")
    private String onboardingOutcome;

    // Set on first login: ADMIN if no users exist yet, otherwise CONSUMER.
    // Elevated to ENTERPRISE / PUBLIC_SECTOR manually via the admin dashboard.
    @Enumerated(EnumType.STRING)
    @Column(name = "account_type", nullable = false)
    @Builder.Default
    private AccountType accountType = AccountType.CONSUMER;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
