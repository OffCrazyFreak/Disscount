package disccount.pinnedStore.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class PinnedStoreDto {

    private UUID id;
    private UUID userId;
    private String storeApiId;
    private String storeName;
    private LocalDateTime createdAt;
}
