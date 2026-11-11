package disscount.preferences;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record PinnedStoreRequest(
        @NotBlank(message = "{validation.storeApiId.required}")
        @Size(min = 1, max = 255, message = "{validation.storeApiId.tooLong}")
        String storeApiId,

        @NotBlank(message = "{validation.storeName.required}")
        @Size(min = 1, max = 255, message = "{validation.storeName.tooLong}")
        String storeName) {
}
