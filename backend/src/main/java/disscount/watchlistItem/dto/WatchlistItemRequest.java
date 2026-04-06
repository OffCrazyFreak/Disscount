package disscount.watchlistItem.dto;

import disscount.watchlistItem.domain.WatchType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WatchlistItemRequest {

    @NotBlank(message = "Product API ID is required")
    private String productApiId;

    @NotNull(message = "Watch type is required")
    private WatchType watchType;

    @NotNull(message = "Threshold value is required")
    @Positive(message = "Threshold value must be positive")
    private Double thresholdValue;
}
