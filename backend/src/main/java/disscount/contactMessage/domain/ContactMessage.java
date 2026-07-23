package disscount.contactMessage.domain;

import disscount.common.domain.BaseEntity;
import disscount.user.domain.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "contact_message")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessage extends BaseEntity {

    // Nullable: anonymous (logged-out) senders are allowed.
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User sender;

    @Column(name = "email")
    private String email;

    @Column(name = "full_name")
    private String fullName;

    @NotBlank
    @Column(nullable = false)
    private String subject;

    @NotBlank
    @Column(nullable = false, length = 5000)
    private String message;

    @Column(name = "source_path")
    private String sourcePath;

    @Column(name = "read_at")
    private LocalDateTime readAt;
}
