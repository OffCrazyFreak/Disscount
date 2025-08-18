package disccount.pinnedPlace.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;

import disccount.user.domain.User;

@Entity
@Table(name = "pinned_place", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "place_api_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PinnedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @NotBlank(message = "Place API ID is required")
    @Column(name = "place_api_id", nullable = false)
    private String placeApiId;

    @NotBlank(message = "Place name is required")
    @Column(name = "place_name", nullable = false)
    private String placeName;
}
