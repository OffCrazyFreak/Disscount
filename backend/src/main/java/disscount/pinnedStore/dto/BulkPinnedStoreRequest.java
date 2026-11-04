package disscount.pinnedStore.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedStoreRequest {

    @NotNull(message = "{validation.pinnedStores.required}")
    @Valid
    private List<PinnedStoreRequest> stores;
}
