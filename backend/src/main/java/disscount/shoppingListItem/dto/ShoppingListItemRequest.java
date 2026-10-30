package disscount.shoppingListItem.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ShoppingListItemRequest {

    @NotBlank(message = "{validation.ean.required}")
    private String ean;

    private String brand;

    @NotBlank(message = "{validation.productName.required}")
    private String name;

    private String quantity;

    private String unit;

    @Min(value = 1, message = "{validation.amount.min}")
    @Max(value = 999, message = "{validation.amount.max}")
    private Integer amount = 1;

    private Boolean isChecked = false;

    // Free-form cijene chain slug (e.g. "konzum", "trgovina-krk"); validate only
    // the format, never against a fixed list, so new upstream chains never break.
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "{validation.chainCode.invalid}")
    private String chainCode;
    private BigDecimal avgPrice;
    private BigDecimal storePrice;
}
