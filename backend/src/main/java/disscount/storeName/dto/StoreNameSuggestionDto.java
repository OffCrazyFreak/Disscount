package disscount.storeName.dto;

import lombok.Builder;
import lombok.Data;

/**
 * No id is exposed: a client cannot act on a single suggestion, and the name is already
 * unique, so it serves as a stable key.
 */
@Data
@Builder
public class StoreNameSuggestionDto {

    private String name;
    private Integer usageCount;
}
