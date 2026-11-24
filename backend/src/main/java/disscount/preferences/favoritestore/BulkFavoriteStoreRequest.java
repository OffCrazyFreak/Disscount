package disscount.preferences.favoritestore;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BulkFavoriteStoreRequest(
        @NotNull(message = "{validation.favoriteStores.required}")
        @Size(max = 10, message = "{validation.favoriteStores.tooMany}")
        List<@NotNull(message = "{validation.storeKey.required}") @Valid FavoriteStoreRequest> stores) {
}
