package disscount.watchlist;

import disscount.shared.AlphabeticalJson;

import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@AlphabeticalJson
@Builder
record WatchlistItemDto(
        UUID id,
        UUID userId,
        String productApiId,
        WatchType watchType,
        Double thresholdValue,
        LocalDateTime createdAt,
        @Schema(nullable = true) LocalDateTime updatedAt) {

    static WatchlistItemDto from(WatchlistItem item) {
        return WatchlistItemDto.builder()
                .id(item.getId())
                .userId(item.getUserId())
                .productApiId(item.getProductApiId())
                .watchType(item.getWatchType())
                .thresholdValue(item.getThresholdValue())
                .createdAt(item.getCreatedAt())
                .updatedAt(item.getUpdatedAt())
                .build();
    }
}
