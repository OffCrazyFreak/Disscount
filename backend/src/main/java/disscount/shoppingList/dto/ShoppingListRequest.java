package disscount.shoppingList.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import disscount.shoppingList.domain.LinkAccess;

@Data
public class ShoppingListRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    // Owner-only. Honoured on create, so a copy can be born shared, and the caller of a
    // create is by definition the new list's owner.
    @Schema(nullable = true)
    private LinkAccess linkAccess;
}
