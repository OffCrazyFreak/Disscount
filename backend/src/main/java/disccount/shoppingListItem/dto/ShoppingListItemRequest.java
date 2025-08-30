package disccount.shoppingListItem.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShoppingListItemRequest {

    @NotBlank(message = "EAN is required")
    private String ean;

    private String brand;

    @NotBlank(message = "Product name is required")
    private String name;

    private String quantity;

    private String unit;

    private Integer amount = 1;
    private Boolean isChecked = false;
}
