package disscount.shoppingList.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/** Booleans, not a level enum, as a copy can take products without progress, or sharing without products. */
@Data
public class ShoppingListCopyRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    /** Without this the copy is just the title, which is a legitimate thing to want. */
    private boolean includeItems;

    /** One flag for all four, as a tick without its price reads as an unrecorded bargain; needs includeItems. */
    private boolean includeProgress;

    /** Owner-only, enforced server side, or a recipient could hand out a link at a level the owner never chose. */
    private boolean includeSharing;
}
