package disscount.digitalCard.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DigitalCardDto {

    private UUID id;
    private UUID userId;
    private String cardName;
    private String cardType;
    private String storeName;
    private String chainCode;
    private String codeValue;
    private String codeType;
    private String cardColor;
    private String iconImage;
    private String frontImage;
    private String backImage;
    private String note;
    private LocalDateTime pinnedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
