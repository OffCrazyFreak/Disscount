package disscount.watchlistItem.dto;

import disscount.watchlistItem.domain.WatchType;
import io.swagger.v3.oas.annotations.media.Schema;
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
    private WatchType watchType;
    private Double thresholdValue;
    @Schema(nullable = true)
    private LocalDateTime lastNotifiedAt;
    private LocalDateTime createdAt;
    @Schema(nullable = true)
    private LocalDateTime updatedAt;
}
