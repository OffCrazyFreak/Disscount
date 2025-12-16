package disscount.shoppingList.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import disscount.shoppingListItem.dto.ShoppingListItemDto;

@Data
@Builder
public class ShoppingListDto {

    private UUID id;
    private UUID ownerId;
    private String title;
    private Boolean isPublic;
    private String aiPrompt;
    private String aiAnswer;
    private LocalDateTime updatedAt;
    private LocalDateTime createdAt;
    private List<ShoppingListItemDto> items;
}
