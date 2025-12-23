package disscount.pinnedPlace.dto;

import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedPlaceRequest {

    @Valid
    private List<PinnedPlaceRequest> places;
}
