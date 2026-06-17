package disscount.user.domain;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.UUID;

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

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
