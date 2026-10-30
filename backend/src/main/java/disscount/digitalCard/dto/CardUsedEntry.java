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

    @NotNull(message = "{validation.card.usedEntry.idRequired}")
    private UUID id;

    @NotNull(message = "{validation.card.usedEntry.timeRequired}")
    private Instant usedAt;
}
