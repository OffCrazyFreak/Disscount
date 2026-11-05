package disscount.watchlistItem.dto;

import disscount.watchlistItem.domain.WatchType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

@Data
public class WatchlistItemRequest {

    @NotBlank(message = "{validation.productApiId.required}")
    private String productApiId;

    @NotNull(message = "{validation.watchType.required}")
    private WatchType watchType;

    @NotNull(message = "{validation.threshold.required}")
    @Positive(message = "{validation.threshold.positive}")
    private Double thresholdValue;
}
