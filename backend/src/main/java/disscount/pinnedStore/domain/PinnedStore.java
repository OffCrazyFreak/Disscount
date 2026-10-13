package disscount.pinnedStore.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

import disscount.user.domain.User;

@Entity
@Table(name = "pinned_store", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "store_api_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedStore {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "{validation.storeApiId.required}")
    @Column(name = "store_api_id", nullable = false)
    private String storeApiId;

    @NotBlank(message = "{validation.storeName.required}")
    @Column(name = "store_name", nullable = false)
    private String storeName;
}
