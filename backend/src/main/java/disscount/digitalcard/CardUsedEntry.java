package disscount.digitalcard;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;

public record CardUsedEntry(
        @NotNull(message = "{validation.card.usedEntry.idRequired}")
        UUID id,

        @NotNull(message = "{validation.card.usedEntry.timeRequired}")
        Instant usedAt) {
}
