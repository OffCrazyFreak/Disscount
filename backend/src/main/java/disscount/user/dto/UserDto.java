package disscount.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

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
    private LocalDateTime createdAt;
}
