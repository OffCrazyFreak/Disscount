package disscount.shoppingList.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * What a copy carries. The client used to answer this by creating a list and then firing
 * one add per item, which is not a transaction: a failed item left a half-populated list
 * behind that no retry could tidy up.
 *
 * <p>Booleans rather than a level enum, because the three are independent: a copy can take
 * the products without the shopping progress, or the sharing without the products.
 */
@Data
public class ShoppingListCopyRequest {

    @NotBlank(message = "Title is required")
    private String title;

    /** Without this the copy is just the title, which is a legitimate thing to want. */
    private boolean includeItems;

    /**
     * What was ticked, the shop it was ticked at, and the prices captured at that moment.
     * One flag for all four: a tick without its price reads as a bargain nobody recorded.
     * Ignored when {@code includeItems} is false, since there is nothing to carry it on.
     */
    private boolean includeProgress;

    /**
     * Carries the source list's link access onto the copy. Owner-only, enforced server
     * side: without that check a recipient could copy a list they were merely shown and
     * hand the owner's people a link at a level the owner never chose to give.
     */
    private boolean includeSharing;
}
