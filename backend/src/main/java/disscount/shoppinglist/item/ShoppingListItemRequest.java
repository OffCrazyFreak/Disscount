package disscount.shoppinglist.item;

import java.math.BigDecimal;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** A missing amount counts as 1 and a missing isChecked as false; ShoppingListItemService applies both. */
public record ShoppingListItemRequest(
        @Schema(nullable = true)
        @Size(max = 255, message = "{validation.ean.tooLong}")
        String ean,

        @Schema(nullable = true)
        @Size(max = 255, message = "{validation.brand.tooLong}")
        String brand,

        @NotBlank(message = "{validation.productName.required}")
        @Size(max = 255, message = "{validation.productName.tooLong}")
        String name,

        @Schema(nullable = true)
        @Size(max = 255, message = "{validation.quantity.tooLong}")
        String quantity,

        @Schema(nullable = true)
        @Size(max = 255, message = "{validation.unit.tooLong}")
        String unit,

        @Min(value = 1, message = "{validation.amount.min}")
        @Max(value = 999, message = "{validation.amount.max}")
        @Schema(nullable = true)
        Integer amount,

        @Schema(nullable = true)
        Boolean isChecked,

        // Validate only the format, never a fixed list, so new upstream chains never break.
        @Pattern(regexp = "^[a-z0-9_-]+$", message = "{validation.chainCode.invalid}")
        @Schema(nullable = true)
        @Size(max = 255, message = "{validation.chainCode.tooLong}")
        String chainCode,

        // The column is numeric(10, 4) and rounds extra decimals, which the app sends for averages, so only size is checked.
        @DecimalMin(value = "0", message = "{validation.price.negative}")
        @DecimalMax(value = "999999.9999", message = "{validation.price.tooLarge}")
        @Schema(nullable = true)
        BigDecimal avgPrice,

        @DecimalMin(value = "0", message = "{validation.price.negative}")
        @DecimalMax(value = "999999.9999", message = "{validation.price.tooLarge}")
        @Schema(nullable = true)
        BigDecimal storePrice) {
}
