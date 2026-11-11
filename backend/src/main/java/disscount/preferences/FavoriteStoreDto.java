package disscount.preferences;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
class FavoriteStoreDto {

    private UUID id;
    private String storeKey;
}
