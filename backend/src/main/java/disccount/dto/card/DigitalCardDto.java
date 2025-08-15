package disccount.dto.card;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalCardDto {
    
    private UUID id;
    private String title;
    private String value;
    private String type;
    private String codeType;
    private String color;
    private String note;
    private LocalDateTime createdAt;
}
