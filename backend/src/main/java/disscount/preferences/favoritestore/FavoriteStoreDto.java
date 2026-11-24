package disscount.preferences.favoritestore;

import disscount.shared.AlphabeticalJson;

import java.util.UUID;

@AlphabeticalJson
record FavoriteStoreDto(UUID id, String storeKey) {

    static FavoriteStoreDto from(FavoriteStore favoriteStore) {
        return new FavoriteStoreDto(favoriteStore.getId(), favoriteStore.getStoreKey());
    }
}
