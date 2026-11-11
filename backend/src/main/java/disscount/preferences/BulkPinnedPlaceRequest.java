package disscount.preferences;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record BulkPinnedPlaceRequest(
        @NotNull(message = "{validation.pinnedPlaces.required}")
        @Valid
        List<PinnedPlaceRequest> places) {
}
