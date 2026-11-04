package disscount.admin.dto;

import disscount.user.domain.enums.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateAccountTypeRequest {
    @NotNull(message = "{validation.accountType.required}")
    private AccountType accountType;
}
