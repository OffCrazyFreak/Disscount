package disscount.shoppingList.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Booleans rather than a level enum, because a copy can take the products without progress, or sharing without products. */
@Data
public class ShoppingListCopyRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    /** Without this the copy is just the title, which is a legitimate thing to want. */
    private boolean includeItems;

    /** One flag for all four, because a tick without its price reads as a bargain nobody recorded; ignored without includeItems. */
    private boolean includeProgress;

    /** Owner-only, enforced server side, or a recipient could hand out a link at a level the owner never chose. */
    private boolean includeSharing;
}
