package disscount.pinnedPlace.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedPlaceRequest {

    @NotNull(message = "{validation.pinnedPlaces.required}")
    @Valid
    private List<PinnedPlaceRequest> places;
}
