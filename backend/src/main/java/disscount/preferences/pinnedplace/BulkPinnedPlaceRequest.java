package disscount.preferences.pinnedplace;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record BulkPinnedPlaceRequest(
        @NotNull(message = "{validation.pinnedPlaces.required}")
        @Valid
        List<@NotNull(message = "{validation.placeApiId.required}") PinnedPlaceRequest> places) {
}
