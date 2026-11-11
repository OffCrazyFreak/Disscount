package disscount.preferences;

import jakarta.validation.constraints.NotBlank;

record PinnedPlaceRequest(
        @NotBlank(message = "{validation.placeApiId.required}")
        String placeApiId,

        @NotBlank(message = "{validation.placeName.required}")
        String placeName) {
}
