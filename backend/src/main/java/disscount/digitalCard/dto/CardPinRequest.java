package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CardPinRequest {

    @NotNull(message = "Navedi je li kartica prikvačena")
    private Boolean pinned;
}
