package disscount.digitalcard;

import jakarta.validation.constraints.NotNull;

record CardArchiveRequest(
        @NotNull(message = "{validation.card.archived.required}")
        Boolean archived) {
}
