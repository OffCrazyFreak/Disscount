package disccount.dto.shopping;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShoppingListItemDto {

    private UUID id;
    private UUID shoppingListId;
    private String productApiId;
    private String productName;
    private Integer amount;
    private Boolean isChecked;
    private LocalDateTime createdAt;
}
