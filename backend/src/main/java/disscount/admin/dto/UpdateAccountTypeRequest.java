package disscount.admin.dto;

import disscount.user.domain.enums.AccountType;
import lombok.Data;

@Data
public class UpdateAccountTypeRequest {
    private AccountType accountType;
}
