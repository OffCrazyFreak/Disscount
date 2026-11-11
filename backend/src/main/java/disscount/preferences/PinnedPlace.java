package disscount.preferences;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

import java.util.UUID;


@Entity
@Table(name = "pinned_place", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "place_api_id"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
class PinnedPlace {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotBlank(message = "{validation.placeApiId.required}")
    @Column(name = "place_api_id", nullable = false)
    private String placeApiId;

    @NotBlank(message = "{validation.placeName.required}")
    @Column(name = "place_name", nullable = false)
    private String placeName;
}
