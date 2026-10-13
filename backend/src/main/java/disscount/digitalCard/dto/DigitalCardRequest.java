package disscount.digitalCard.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@ValidDateRange
public class DigitalCardRequest {

    @NotBlank(message = "{validation.card.name.required}")
    @TrimmedLength(min = 2, max = 60, message = "{validation.card.name.length}")
    @NoNul
    private String cardName;

    @NotNull(message = "{validation.card.type.invalid}")
    @Pattern(regexp = "loyalty|gift|membership|other", message = "{validation.card.type.invalid}")
    private String cardType;

    @NotBlank(message = "{validation.card.store.required}")
    @TrimmedLength(min = 2, max = 60, message = "{validation.card.store.length}")
    @NoNul
    private String storeName;

    @Size(max = 40, message = "{validation.card.chainCode.tooLong}")
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "{validation.card.chainCode.invalid}")
    private String chainCode;

    @NotBlank(message = "{validation.card.code.required}")
    @Size(max = 4096, message = "{validation.card.code.tooLong}")
    @NoNul
    private String codeValue;

    @Size(max = 4096, message = "{validation.card.barcode.tooLong}")
    @NoNul
    private String barcodeValue;

    @NotNull(message = "{validation.card.codeType.invalid}")
    @Pattern(regexp = "ean_13|ean_8|upc_a|upc_e|code_128|code_39|code_93|codabar|itf|qr_code|aztec|data_matrix|pdf417|unknown",
            message = "{validation.card.codeType.invalid}")
    private String codeType;

    @NotNull(message = "{validation.card.color.invalid}")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "{validation.card.color.invalid}")
    private String cardColor;

    @Size(max = 500, message = "{validation.card.note.tooLong}")
    @NoNul
    private String note;

    private LocalDate validFrom;

    private LocalDate expiresOn;

    @DecimalMin(value = "0", message = "{validation.card.balance.negative}")
    @DecimalMax(value = "1000000", message = "{validation.card.balance.tooLarge}")
    @Digits(integer = 7, fraction = 2, message = "{validation.card.balance.decimals}")
    private BigDecimal balance;

    @Pattern(regexp = "^[A-Z]{3}$", message = "{validation.card.currency.invalid}")
    private String balanceUnit;
}
