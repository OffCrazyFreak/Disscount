package disscount.shoppinglist;

import disscount.shared.AlphabeticalJson;
import disscount.shoppinglist.item.ShoppingListItemDto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

@AlphabeticalJson
@Builder
record ShoppingListDto(
        UUID id,
        @Schema(nullable = true) UUID ownerId,
        String title,

        // Owner-only: a link visitor would learn the list is shared more widely than their access shows.
        @Schema(nullable = true) ListAccess linkAccess,

        // The caller's resolved access, echoed back so the frontend never re-derives the rule.
        ListAccess myAccess,

        LocalDateTime updatedAt,
        LocalDateTime createdAt,
        List<ShoppingListItemDto> items) {
}
