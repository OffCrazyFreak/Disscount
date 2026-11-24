package disscount.digitalcard;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.Builder;

import disscount.digitalcard.photo.CardPhotoDto;

@Builder
public record DigitalCardDto(
        UUID id,
        String cardName,
        String cardType,
        String storeName,
        @Schema(nullable = true) String chainCode,
        String codeValue,
        @Schema(nullable = true) String barcodeValue,
        String codeType,
        String cardColor,
        @Schema(nullable = true) String note,
        @Schema(nullable = true) LocalDate validFrom,
        @Schema(nullable = true) LocalDate expiresOn,
        @Schema(nullable = true) BigDecimal balance,
        @Schema(nullable = true) String balanceUnit,
        @Schema(nullable = true) LocalDateTime pinnedAt,
        @Schema(nullable = true) LocalDateTime lastUsedAt,
        @Schema(nullable = true) LocalDateTime archivedAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<CardPhotoDto> photos) {
}
