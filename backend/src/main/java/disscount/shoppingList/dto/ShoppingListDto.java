package disscount.shoppingList.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingListItem.dto.ShoppingListItemDto;

@Data
@Builder
public class ShoppingListDto {

    private UUID id;
    @Schema(nullable = true)
    private UUID ownerId;
    private String title;

    // Owner-only: a link visitor would learn the list is shared more widely than their access shows.
    @Schema(nullable = true)
    private ListAccess linkAccess;

    /** The caller's resolved access, echoed back so the frontend never re-derives the rule. */
    private ListAccess myAccess;

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    private List<ShoppingListItemDto> items;
}
