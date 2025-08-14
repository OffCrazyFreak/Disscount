package disccount.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GoogleAuthRequest {

    @NotBlank(message = "Google ID token is required")
    private String idToken;

    private Integer stayLoggedInDays = 30;
    private Boolean notificationsPush = true;
    private Boolean notificationsEmail = true;
}
