package disscount.pinnedStore.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PinnedStoreRequest {

    @NotBlank(message = "{validation.storeApiId.required}")
    private String storeApiId;

    @NotBlank(message = "{validation.storeName.required}")
    private String storeName;
}
