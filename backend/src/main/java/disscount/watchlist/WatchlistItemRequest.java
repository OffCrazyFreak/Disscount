package disscount.watchlist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record WatchlistItemRequest(
        @NotBlank(message = "{validation.productApiId.required}")
        String productApiId,

        @NotNull(message = "{validation.watchType.required}")
        WatchType watchType,

        @NotNull(message = "{validation.threshold.required}")
        @Positive(message = "{validation.threshold.positive}")
        Double thresholdValue) {
}
