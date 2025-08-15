package disccount.pinnedStore.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedStoreRequest {

    @NotEmpty(message = "At least one store must be provided")
    @Valid
    private List<PinnedStoreRequest> stores;
}
