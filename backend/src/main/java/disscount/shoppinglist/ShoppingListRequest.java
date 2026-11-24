package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShoppingListRequest(
        @NotBlank(message = "{validation.title.required}")
        @Size(max = 100, message = "{validation.title.tooLong}")
        String title,

        // Owner-only; honoured on create so a copy can be born shared, as a create's caller is the new list's owner.
        @Schema(nullable = true)
        LinkAccess linkAccess) {
}
