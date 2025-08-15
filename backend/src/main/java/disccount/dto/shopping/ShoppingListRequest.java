package disccount.dto.shopping;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ShoppingListRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private Boolean isPublic = false;
    private String aiPrompt;
}
