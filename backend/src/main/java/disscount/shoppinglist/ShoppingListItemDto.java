package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

import java.math.BigDecimal;

@Data
@Builder
class ShoppingListItemDto {

    private UUID id;
    private UUID shoppingListId;
    @Schema(nullable = true)
    private String ean;
    @Schema(nullable = true)
    private String brand;
    private String name;
    @Schema(nullable = true)
    private String quantity;
    @Schema(nullable = true)
    private String unit;
    private Integer amount;
    private Boolean isChecked;
    @Schema(nullable = true)
    private String chainCode;
    @Schema(nullable = true)
    private BigDecimal avgPrice;
    @Schema(nullable = true)
    private BigDecimal storePrice;    
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    @Schema(nullable = true)
    private UUID updatedByUserId;
}
