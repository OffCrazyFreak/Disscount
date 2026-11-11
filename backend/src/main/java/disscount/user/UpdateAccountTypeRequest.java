package disscount.user;

import jakarta.validation.constraints.NotNull;

record UpdateAccountTypeRequest(
        @NotNull(message = "{validation.accountType.required}")
        AccountType accountType) {
}
