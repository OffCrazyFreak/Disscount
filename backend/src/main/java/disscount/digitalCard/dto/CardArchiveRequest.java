package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CardArchiveRequest {

    @NotNull(message = "{validation.card.archived.required}")
    private Boolean archived;
}
