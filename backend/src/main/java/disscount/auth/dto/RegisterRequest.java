package disscount.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegisterRequest {

    @Size(min = 2, max = 40, message = "Username must be between 2 and 40 characters")
    private String username;

    @NotBlank(message = "Email is required")
    @Email(message = "Email should be valid")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 12, max = 100, message = "Password must be between 12 and 40 characters")
    private String password;

    private Integer stayLoggedInDays = 30;
    private Boolean notificationsPush = true;
    private Boolean notificationsEmail = true;
}
