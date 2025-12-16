package disscount.pinnedPlace.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class PinnedPlaceDto {

    private UUID id;
    private UUID userId;
    private String placeApiId;
    private String placeName;
}
