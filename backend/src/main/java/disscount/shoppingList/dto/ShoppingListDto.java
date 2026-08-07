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

    // Owner-only: a link visitor who could read this would learn the list is shared more
    // widely than their own access shows, and the share control keys off it.
    private ListAccess linkAccess;

    /** The caller's resolved access, echoed back so the frontend never re-derives the rule. */
    private ListAccess myAccess;

    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    private List<ShoppingListItemDto> items;
}
