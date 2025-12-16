package disscount.notification.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class NotificationRequest {

    @NotBlank(message = "Message is required")
    private String message;

    private String relatedProductApiId;
    private String relatedStoreApiId;
}
