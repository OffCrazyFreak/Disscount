package disccount.dto.shopping;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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
