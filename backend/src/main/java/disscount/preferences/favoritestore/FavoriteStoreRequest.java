package disscount.preferences.favoritestore;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record FavoriteStoreRequest(
        @NotBlank(message = "{validation.storeKey.required}")
        @Size(max = 100, message = "{validation.storeKey.tooLong}")
        String storeKey) {
}
