package disscount.user.dto;

import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
}
