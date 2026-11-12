package disscount.shoppinglist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/** Booleans, not a level enum, as a copy can take products without progress, or sharing without products. */
// A class, not a record: Jackson 3 rejects a missing primitive in a record, and a missing flag here means false.
@Data
public class ShoppingListCopyRequest {

    @NotBlank(message = "{validation.title.required}")
    @Size(max = 100, message = "{validation.title.tooLong}")
    private String title;

    /** Without this the copy is just the title, which is a legitimate thing to want. */
    private boolean includeItems;

    /** One flag for all four, as a tick without its price reads as a bargain; ignored without includeItems. */
    private boolean includeProgress;

    /** Owner-only, enforced server side, or a recipient could hand out a link at a level the owner never chose. */
    private boolean includeSharing;
}
