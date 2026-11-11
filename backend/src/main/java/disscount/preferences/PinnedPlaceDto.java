package disscount.preferences;

import disscount.shared.AlphabeticalJson;

import java.util.UUID;

@AlphabeticalJson
record PinnedPlaceDto(UUID id, UUID userId, String placeApiId, String placeName) {

    static PinnedPlaceDto from(PinnedPlace pinnedPlace) {
        return new PinnedPlaceDto(
                pinnedPlace.getId(),
                pinnedPlace.getUserId(),
                pinnedPlace.getPlaceApiId(),
                pinnedPlace.getPlaceName());
    }
}
