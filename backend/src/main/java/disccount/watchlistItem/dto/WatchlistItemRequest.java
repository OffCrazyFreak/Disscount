package disccount.watchlistItem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class WatchlistItemRequest {

    @NotBlank(message = "Product API ID is required")
    private String productApiId;

    @NotBlank(message = "Product name is required")
    private String productName;
}
