package disscount.digitalCard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DigitalCardDto {

    private UUID id;
    private String cardName;
    private String cardType;
    private String storeName;
    private String chainCode;
    private String codeValue;
    private String barcodeValue;
    private String codeType;
    private String cardColor;
    private String note;
    private LocalDate validFrom;
    private LocalDate expiresOn;
    private BigDecimal balance;
    private String balanceUnit;
    private LocalDateTime pinnedAt;
    private LocalDateTime lastUsedAt;
    private LocalDateTime archivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CardPhotoDto> photos;
}
