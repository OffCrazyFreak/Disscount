package disscount.user;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
class UpdateAccountTypeRequest {
    @NotNull(message = "{validation.accountType.required}")
    private AccountType accountType;
}
