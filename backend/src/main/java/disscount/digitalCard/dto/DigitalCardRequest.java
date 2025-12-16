package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DigitalCardRequest {

    @NotBlank(message = "Title is required")
    private String title;

    @NotBlank(message = "Value is required")
    private String value;

    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Code type is required")
    private String codeType;

    private String color;
    private String note;
}
