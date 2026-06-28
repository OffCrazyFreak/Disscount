package disscount.shoppingListItem.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
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

    @Min(value = 1, message = "Amount must be at least 1")
    @Max(value = 999, message = "Amount must not exceed 999")
    private Integer amount = 1;

    private Boolean isChecked = false;
    private String chainCode;
    private BigDecimal avgPrice;
    private BigDecimal storePrice;
}
