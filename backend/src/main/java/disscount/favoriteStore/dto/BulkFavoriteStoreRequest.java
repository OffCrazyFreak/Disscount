package disscount.favoriteStore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class BulkFavoriteStoreRequest {

    @NotNull(message = "{validation.favoriteStores.required}")
    @Size(max = 10, message = "{validation.favoriteStores.tooMany}")
    private List<@NotNull(message = "{validation.storeKey.required}") @Valid FavoriteStoreRequest> stores;
}
