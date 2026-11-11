package disscount.preferences;

import jakarta.validation.constraints.NotBlank;

record PinnedStoreRequest(
        @NotBlank(message = "{validation.storeApiId.required}")
        String storeApiId,

        @NotBlank(message = "{validation.storeName.required}")
        String storeName) {
}
