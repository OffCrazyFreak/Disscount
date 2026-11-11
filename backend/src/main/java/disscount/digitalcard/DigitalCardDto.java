package disscount.digitalcard;

import io.swagger.v3.oas.annotations.media.Schema;
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
    @Schema(nullable = true)
    private String chainCode;
    private String codeValue;
    @Schema(nullable = true)
    private String barcodeValue;
    private String codeType;
    private String cardColor;
    @Schema(nullable = true)
    private String note;
    @Schema(nullable = true)
    private LocalDate validFrom;
    @Schema(nullable = true)
    private LocalDate expiresOn;
    @Schema(nullable = true)
    private BigDecimal balance;
    @Schema(nullable = true)
    private String balanceUnit;
    @Schema(nullable = true)
    private LocalDateTime pinnedAt;
    @Schema(nullable = true)
    private LocalDateTime lastUsedAt;
    @Schema(nullable = true)
    private LocalDateTime archivedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<CardPhotoDto> photos;
}
