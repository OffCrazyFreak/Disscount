package disscount.shoppingListItem.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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

    // Free-form cijene chain slug (e.g. "konzum", "trgovina-krk"); validate only
    // the format, never against a fixed list, so new upstream chains never break.
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "Invalid chain code")
    private String chainCode;
    private BigDecimal avgPrice;
    private BigDecimal storePrice;
}
