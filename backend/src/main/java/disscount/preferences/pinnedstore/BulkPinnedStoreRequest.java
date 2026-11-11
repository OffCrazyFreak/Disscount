package disscount.preferences.pinnedstore;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record BulkPinnedStoreRequest(
        @NotNull(message = "{validation.pinnedStores.required}")
        @Valid
        List<@NotNull(message = "{validation.storeApiId.required}") PinnedStoreRequest> stores) {
}
