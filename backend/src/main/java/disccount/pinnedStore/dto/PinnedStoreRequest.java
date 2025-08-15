package disccount.pinnedStore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PinnedStoreRequest {

    @NotBlank(message = "Store API ID is required")
    private String storeApiId;

    @NotBlank(message = "Store name is required")
    private String storeName;
}
