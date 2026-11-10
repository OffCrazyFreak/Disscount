package disscount.digitalcard;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
class CardPinRequest {

    @NotNull(message = "{validation.card.pinned.required}")
    private Boolean pinned;
}
