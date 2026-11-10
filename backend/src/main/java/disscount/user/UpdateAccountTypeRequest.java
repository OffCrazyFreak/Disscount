package disscount.user;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateAccountTypeRequest {
    @NotNull(message = "{validation.accountType.required}")
    private AccountType accountType;
}
