package disccount.dto.shopping;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShoppingListItemRequest {

    @NotBlank(message = "Product API ID is required")
    private String productApiId;

    @NotBlank(message = "Product name is required")
    private String productName;

    private Integer amount = 1;
    private Boolean isChecked = false;
}
