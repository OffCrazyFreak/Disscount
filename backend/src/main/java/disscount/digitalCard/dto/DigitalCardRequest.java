package disscount.digitalCard.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@ValidDateRange
public class DigitalCardRequest {

    @NotBlank(message = "Upiši naziv kartice")
    @TrimmedLength(min = 2, max = 60, message = "Naziv kartice mora imati od 2 do 60 znakova")
    @NoNul
    private String cardName;

    @NotNull(message = "Odaberi vrstu kartice")
    @Pattern(regexp = "loyalty|gift|membership|other", message = "Odaberi vrstu kartice")
    private String cardType;

    @NotBlank(message = "Upiši trgovinu")
    @TrimmedLength(min = 2, max = 60, message = "Naziv trgovine mora imati od 2 do 60 znakova")
    @NoNul
    private String storeName;

    @Size(max = 40, message = "Oznaka lanca je preduga")
    @Pattern(regexp = "^[a-z0-9_-]+$", message = "Oznaka lanca nije valjana")
    private String chainCode;

    @NotBlank(message = "Upiši broj ili kod kartice")
    @Size(max = 4096, message = "Kod kartice je predug")
    @NoNul
    private String codeValue;

    @Size(max = 4096, message = "Kod je predug")
    @NoNul
    private String barcodeValue;

    @NotNull(message = "Odaberi vrstu koda")
    @Pattern(regexp = "ean_13|ean_8|upc_a|upc_e|code_128|code_39|code_93|codabar|itf|qr_code|aztec|data_matrix|pdf417|unknown",
            message = "Odaberi vrstu koda")
    private String codeType;

    @NotNull(message = "Odaberi boju")
    @Pattern(regexp = "^#[0-9A-Fa-f]{6}$", message = "Odaberi boju")
    private String cardColor;

    @Size(max = 500, message = "Bilješka može imati najviše 500 znakova")
    @NoNul
    private String note;

    private LocalDate validFrom;

    private LocalDate expiresOn;

    @DecimalMin(value = "0", message = "Iznos ne može biti negativan")
    @DecimalMax(value = "1000000", message = "Iznos je prevelik")
    @Digits(integer = 7, fraction = 2, message = "Iznos može imati najviše 2 decimale")
    private BigDecimal balance;

    @Pattern(regexp = "^[A-Z]{3}$", message = "Valuta nije valjana")
    private String balanceUnit;
}
