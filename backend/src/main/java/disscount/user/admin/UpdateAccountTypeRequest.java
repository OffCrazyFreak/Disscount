package disscount.user.admin;

import jakarta.validation.constraints.NotNull;

import disscount.user.AccountType;

record UpdateAccountTypeRequest(
        @NotNull(message = "{validation.accountType.required}")
        AccountType accountType) {
}
