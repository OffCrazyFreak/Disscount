package disscount.preferences;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
class PinnedPlaceDto {

    private UUID id;
    private UUID userId;
    private String placeApiId;
    private String placeName;
}
