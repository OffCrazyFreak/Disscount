package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DigitalCardRequest {

    @NotBlank(message = "{validation.title.required}")
    private String title;

    @NotBlank(message = "{validation.value.required}")
    private String value;

    @NotBlank(message = "{validation.type.required}")
    private String type;

    @NotBlank(message = "{validation.codeType.required}")
    private String codeType;

    private String color;
    private String note;
}
