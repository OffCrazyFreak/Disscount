package disscount.pinnedPlace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PinnedPlaceRequest {

    @NotBlank(message = "Place API ID is required")
    private String placeApiId;

    @NotBlank(message = "Place name is required")
    private String placeName;
}
