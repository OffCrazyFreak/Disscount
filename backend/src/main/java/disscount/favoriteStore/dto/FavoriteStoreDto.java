package disscount.favoriteStore.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class FavoriteStoreDto {

    private UUID id;
    private String storeKey;
}
