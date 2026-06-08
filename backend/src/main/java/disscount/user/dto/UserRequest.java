package disscount.user.dto;

import lombok.Data;

@Data
public class UserRequest {
    // All fields optional; only provided fields will be updated
    private String username;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
}
