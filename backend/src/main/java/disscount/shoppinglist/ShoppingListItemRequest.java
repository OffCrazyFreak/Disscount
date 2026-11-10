package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.media.Schema;
import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class ShoppingListItemRequest {

    @Schema(nullable = true)
    private String ean;

    @Schema(nullable = true)
    private String brand;

    @NotBlank(message = "{validation.productName.required}")
    private String name;

    @Schema(nullable = true)
    private String quantity;

    @Schema(nullable = true)
    private String unit;

    @Min(value = 1, message = "{validation.amount.min}")
    @Max(value = 999, message = "{validation.amount.max}")
    @Schema(nullable = true)
    private Integer amount = 1;

    @Schema(nullable = true)
    private Boolean isChecked = false;

    // Validate only the format, never a fixed list, so new upstream chains never break.
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "{validation.chainCode.invalid}")
    @Schema(nullable = true)
    private String chainCode;
    @Schema(nullable = true)
    private BigDecimal avgPrice;
    @Schema(nullable = true)
    private BigDecimal storePrice;
}
