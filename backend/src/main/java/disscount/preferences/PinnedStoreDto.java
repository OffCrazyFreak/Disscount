package disscount.preferences;

import disscount.shared.AlphabeticalJson;

import java.util.UUID;

@AlphabeticalJson
record PinnedStoreDto(UUID id, UUID userId, String storeApiId, String storeName) {

    static PinnedStoreDto from(PinnedStore pinnedStore) {
        return new PinnedStoreDto(
                pinnedStore.getId(),
                pinnedStore.getUserId(),
                pinnedStore.getStoreApiId(),
                pinnedStore.getStoreName());
    }
}
