package disscount.shoppinglist;

import disscount.shared.AlphabeticalJson;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@AlphabeticalJson
@Builder
record ShoppingListItemDto(
        UUID id,
        UUID shoppingListId,
        @Schema(nullable = true) String ean,
        @Schema(nullable = true) String brand,
        String name,
        @Schema(nullable = true) String quantity,
        @Schema(nullable = true) String unit,
        Integer amount,
        Boolean isChecked,
        @Schema(nullable = true) String chainCode,
        @Schema(nullable = true) BigDecimal avgPrice,
        @Schema(nullable = true) BigDecimal storePrice,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        @Schema(nullable = true) UUID updatedByUserId) {
}
