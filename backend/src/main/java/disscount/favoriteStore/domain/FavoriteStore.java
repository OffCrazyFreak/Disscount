package disscount.favoriteStore.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

import disscount.user.domain.User;

@Entity
@Table(name = "favorite_store",
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "store_key"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FavoriteStore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** The store's chain and code as the frontend keys it, "konzum:123". */
    @NotBlank(message = "{validation.storeKey.required}")
    @Column(name = "store_key", nullable = false)
    private String storeKey;
}
