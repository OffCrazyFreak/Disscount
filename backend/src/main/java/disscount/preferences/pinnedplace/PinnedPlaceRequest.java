package disscount.preferences.pinnedplace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record PinnedPlaceRequest(
        @NotBlank(message = "{validation.placeApiId.required}")
        @Size(min = 1, max = 255, message = "{validation.placeApiId.tooLong}")
        String placeApiId,

        @NotBlank(message = "{validation.placeName.required}")
        @Size(min = 1, max = 255, message = "{validation.placeName.tooLong}")
        String placeName) {
}
