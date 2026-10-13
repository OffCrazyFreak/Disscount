package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CardArchiveRequest {

    @NotNull(message = "Navedi je li kartica arhivirana")
    private Boolean archived;
}
