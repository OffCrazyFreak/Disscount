package disscount.preferences.pinnedplace;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BulkPinnedPlaceRequest(
        @NotNull(message = "{validation.pinnedPlaces.required}")
        @Size(max = 50, message = "{validation.pinnedPlaces.tooMany}")
        @Valid
        List<@NotNull(message = "{validation.placeApiId.required}") PinnedPlaceRequest> places) {
}
