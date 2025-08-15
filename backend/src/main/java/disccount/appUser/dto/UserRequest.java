package disccount.appUser.dto;

import lombok.Data;

@Data
public class UserRequest {
    // All fields optional; only provided fields will be updated
    private String username;
    private Integer stayLoggedInDays;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;
}
