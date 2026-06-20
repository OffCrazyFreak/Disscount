package disscount.user.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UserRequest {
    private String username;
    private Boolean notificationsPush;
    private Boolean notificationsEmail;

    // Base64 data URI; ~1.4 MB cap matches the 1 MB raw-image limit enforced on the client
    @Size(max = 2_000_000, message = "Slika je prevelika")
    private String image;
}
