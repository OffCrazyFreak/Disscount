package disscount.preferences;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
class PinnedStoreRequest {

    @NotBlank(message = "{validation.storeApiId.required}")
    private String storeApiId;

    @NotBlank(message = "{validation.storeName.required}")
    private String storeName;
}
