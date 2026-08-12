package disscount.digitalCard.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DigitalCardRequest {

    @NotBlank(message = "Naziv kartice je obavezan")
    @Size(min = 2, max = 60, message = "Naziv kartice mora imati između 2 i 60 znakova")
    private String cardName;

    @NotBlank(message = "Tip kartice je obavezan")
    @Pattern(regexp = "loyalty|gift|membership|other", message = "Neispravan tip kartice")
    private String cardType;

    @NotBlank(message = "Naziv trgovine je obavezan")
    @Size(min = 2, max = 60, message = "Naziv trgovine mora imati između 2 i 60 znakova")
    private String storeName;

    @Size(max = 40, message = "Neispravna oznaka trgovine")
    private String chainCode;

    @NotBlank(message = "Kod kartice je obavezan")
    @Size(max = 4096, message = "Kod kartice je predug")
    private String codeValue;

    // Barcode Detection API vocabulary, deliberately not pattern-constrained beyond
    // length: a browser adding a format should not need a backend release.
    @NotBlank(message = "Tip koda je obavezan")
    @Size(max = 32, message = "Neispravan tip koda")
    private String codeType;

    @NotBlank(message = "Boja kartice je obavezna")
    @Pattern(regexp = "#[0-9a-fA-F]{6}", message = "Neispravna boja kartice")
    private String cardColor;

    // Base64 data URIs. The client downscales the icon to 256px and the card faces to
    // 1024px WebP, so these are abuse backstops rather than the real limits.
    @Size(max = 400_000, message = "Ikona je prevelika")
    private String iconImage;

    @Size(max = 1_200_000, message = "Slika prednje strane je prevelika")
    private String frontImage;

    @Size(max = 1_200_000, message = "Slika stražnje strane je prevelika")
    private String backImage;

    @Size(max = 500, message = "Bilješka može imati najviše 500 znakova")
    private String note;
}
