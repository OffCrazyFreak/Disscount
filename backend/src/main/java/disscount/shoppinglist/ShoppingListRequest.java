package disscount.shoppinglist;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShoppingListRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    // Owner-only; honoured on create so a copy can be born shared, as a create's caller is the new list's owner.
    @Schema(nullable = true)
    private LinkAccess linkAccess;
}
