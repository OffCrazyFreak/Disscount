package disccount.watchlistItem.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class WatchlistItemDto {

    private UUID id;
    private UUID userId;
    private String productApiId;
    private String productName;
    private LocalDateTime lastNotifiedAt;
    private LocalDateTime createdAt;
}
