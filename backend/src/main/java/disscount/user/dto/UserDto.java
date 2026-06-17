package disscount.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

import disscount.user.domain.enums.AccountType;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDto {

    private UUID id;
    private String username;
    private String email;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
    private AccountType accountType;
    private LocalDateTime createdAt;
}
