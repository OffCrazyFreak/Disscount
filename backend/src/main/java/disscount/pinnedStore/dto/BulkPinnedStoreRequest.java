package disscount.pinnedStore.dto;

import jakarta.validation.Valid;
import lombok.Data;

import java.util.List;

@Data
public class BulkPinnedStoreRequest {

    @Valid
    private List<PinnedStoreRequest> stores;
}
