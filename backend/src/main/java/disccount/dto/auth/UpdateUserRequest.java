package disccount.dto.auth;

import lombok.Data;

@Data
public class UpdateUserRequest {
    // All fields optional; only provided fields will be updated
    private String username;
    private Integer stayLoggedInDays;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
}
