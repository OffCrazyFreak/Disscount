package disscount.preferences;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public record BulkPinnedStoreRequest(
        @NotNull(message = "{validation.pinnedStores.required}")
        @Valid
        List<PinnedStoreRequest> stores) {
}
