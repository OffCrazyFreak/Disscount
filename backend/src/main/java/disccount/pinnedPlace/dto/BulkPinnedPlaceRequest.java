package disccount.pinnedPlace.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedPlaceRequest {

    @NotEmpty(message = "At least one place must be provided")
    @Valid
    private List<PinnedPlaceRequest> places;
}
