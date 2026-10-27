package disscount.favoriteStore.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class FavoriteStoreRequest {

    @NotBlank(message = "{validation.storeKey.required}")
    @Size(max = 100, message = "{validation.storeKey.tooLong}")
    private String storeKey;
}
