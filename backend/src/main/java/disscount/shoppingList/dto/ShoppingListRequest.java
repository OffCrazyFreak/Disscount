package disscount.shoppingList.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import disscount.shoppingList.domain.LinkAccess;

@Data
public class ShoppingListRequest {

    @NotBlank(message = "Title is required")
    private String title;

    // Owner-only, and ignored on create: sharing is turned on from an existing list,
    // because there is no id to bind a token to until the list has been saved.
    // LinkAccess rather than ListAccess, so OWNER cannot be sent at all.
    private LinkAccess linkAccess;
}
