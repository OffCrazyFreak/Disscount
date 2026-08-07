package disscount.shoppingList.dto;

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
    private UUID ownerId;
    private String title;

    // Both owner-only: a link visitor handed the token could reshare the list at a level
    // its owner never granted.
    private ListAccess linkAccess;
    private UUID shareToken;

    /** The caller's resolved access, echoed back so the frontend never re-derives the rule. */
    private ListAccess myAccess;

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    private List<ShoppingListItemDto> items;
}
