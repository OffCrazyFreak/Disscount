package disscount.pinnedPlace.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PinnedPlaceRequest {

    @NotBlank(message = "{validation.placeApiId.required}")
    private String placeApiId;

    @NotBlank(message = "{validation.placeName.required}")
    private String placeName;
}
