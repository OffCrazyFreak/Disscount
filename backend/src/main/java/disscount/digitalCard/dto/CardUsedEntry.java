package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CardUsedEntry {

    @NotNull(message = "Svaki unos mora imati id")
    private UUID id;

    @NotNull(message = "Svaki unos mora imati vrijeme")
    private Instant usedAt;
}
