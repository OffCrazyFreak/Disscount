package disscount.digitalcard;

import disscount.shared.TrimmedLength;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;

import lombok.Builder;

@ValidDateRange
@Builder(toBuilder = true)
public record DigitalCardRequest(
        @NotBlank(message = "{validation.card.name.required}")
        @TrimmedLength(min = 2, max = 60, message = "{validation.card.name.length}")
        @Pattern(regexp = NO_NUL, message = "{validation.text.invalidCharacter}")
        String cardName,

        @NotNull(message = "{validation.card.type.invalid}")
        @Pattern(regexp = "loyalty|gift|membership|other", message = "{validation.card.type.invalid}")
        String cardType,

        @NotBlank(message = "{validation.card.store.required}")
        @TrimmedLength(min = 2, max = 60, message = "{validation.card.store.length}")
        @Pattern(regexp = NO_NUL, message = "{validation.text.invalidCharacter}")
        String storeName,

        @Size(max = 40, message = "{validation.card.chainCode.tooLong}")
        @Pattern(regexp = "^[a-z0-9_-]+$", message = "{validation.card.chainCode.invalid}")
        @Schema(nullable = true)
        String chainCode,

        @NotBlank(message = "{validation.card.code.required}")
        @Size(max = 4096, message = "{validation.card.code.tooLong}")
        @Pattern(regexp = NO_NUL, message = "{validation.text.invalidCharacter}")
        String codeValue,

        @Size(max = 4096, message = "{validation.card.barcode.tooLong}")
        @Pattern(regexp = NO_NUL, message = "{validation.text.invalidCharacter}")
        @Schema(nullable = true)
        String barcodeValue,

        @NotNull(message = "{validation.card.codeType.invalid}")
        @Pattern(regexp = "ean_13|ean_8|upc_a|upc_e|code_128|code_39|code_93|codabar|itf|qr_code|aztec|data_matrix|pdf417|unknown",
                message = "{validation.card.codeType.invalid}")
        String codeType,

        @NotNull(message = "{validation.card.color.invalid}")
        @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "{validation.card.color.invalid}")
        String cardColor,

        @Size(max = 500, message = "{validation.card.note.tooLong}")
        @Pattern(regexp = NO_NUL, message = "{validation.text.invalidCharacter}")
        @Schema(nullable = true)
        String note,

        @Schema(nullable = true)
        LocalDate validFrom,

        @Schema(nullable = true)
        LocalDate expiresOn,

        @DecimalMin(value = "0", message = "{validation.card.balance.negative}")
        @DecimalMax(value = "1000000", message = "{validation.card.balance.tooLarge}")
        @Digits(integer = 7, fraction = 2, message = "{validation.card.balance.decimals}")
        @Schema(nullable = true)
        BigDecimal balance,

        @Pattern(regexp = "^[A-Z]{3}$", message = "{validation.card.currency.invalid}")
        @Schema(nullable = true)
        String balanceUnit) {

    // PostgreSQL cannot store a NUL in text, so it would surface as a 500 instead of a form error.
    static final String NO_NUL = "[^\\x00]*";
}
