package disscount.digitalcard;

import jakarta.validation.constraints.NotNull;

record CardPinRequest(
        @NotNull(message = "{validation.card.pinned.required}")
        Boolean pinned) {
}
