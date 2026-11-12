package disscount.preferences.pinnedstore;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BulkPinnedStoreRequest(
        @NotNull(message = "{validation.pinnedStores.required}")
        @Size(max = 50, message = "{validation.pinnedStores.tooMany}")
        @Valid
        List<@NotNull(message = "{validation.storeApiId.required}") PinnedStoreRequest> stores) {
}
