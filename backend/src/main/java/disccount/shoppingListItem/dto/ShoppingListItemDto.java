package disccount.shoppingListItem.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ShoppingListItemDto {

    private UUID id;
    private UUID shoppingListId;
    private String ean;
    private String brand;
    private String name;
    private String quantity;
    private String unit;
    private Integer amount;
    private Boolean isChecked;
    private LocalDateTime createdAt;
}
