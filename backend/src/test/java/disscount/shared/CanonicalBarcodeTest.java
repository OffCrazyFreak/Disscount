package disscount.shared;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

import static org.assertj.core.api.Assertions.assertThat;

// Examples from cijene-api's common/barcodes.py and the GS1 General Specifications restricted prefixes.
class CanonicalBarcodeTest {

    @ParameterizedTest(name = "{0} becomes {1}")
    @CsvSource({
            "0000054490970, 54490970",
            "54490970, 54490970",
            "0012345678905, 12345678905",
            "00012345678905, 12345678905",
            "' 0012345678905 ', 12345678905",
            // UPC-A number system 0 (Del Monte, OGX): a global code, merged with its bare form.
            "024000011859, 24000011859",
            "022796976024, 22796976024",
            "3856021300547, 3856021300547",
            "10012345678902, 10012345678902",
            // Prefix 00 once padded to 13 digits, so a global code despite the inner 2.
            "0020000000000, 20000000000",
    })
    void stripsTheLeadingZerosOfAGlobalCode(String barcode, String canonical) {
        assertThat(CanonicalBarcode.of(barcode)).isEqualTo(canonical);
        assertThat(CanonicalBarcode.of(canonical)).isEqualTo(canonical);
    }

    @ParameterizedTest
    @ValueSource(strings = {
            // GTIN-13 prefixes 02, 04 and 20 to 29 are in-store codes and keep their zeros.
            "0212345678901", "0412345678903", "2012345678901", "2912345678906",
            // A UPC-A of number system 2 reads as prefix 02 once padded to 13 digits.
            "212345678901",
            // GTIN-8 prefixes 0 and 2.
            "02345673", "20123956", "00012345",
            // A GTIN-14 is judged by the GTIN-13 behind its indicator digit.
            "02012345678901",
    })
    void leavesAnInStoreCodeAsSent(String barcode) {
        assertThat(CanonicalBarcode.of(barcode)).isEqualTo(barcode);
        assertThat(CanonicalBarcode.isRestrictedCirculation(barcode)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"konzum:0012345", "1234567", "0012345", "00000000", "0012a45678905", "٠٠١٢٣٤٥٦٧٨٩٠٥"})
    void leavesWhatIsNoGtinAlone(String barcode) {
        assertThat(CanonicalBarcode.of(barcode)).isEqualTo(barcode);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void leavesAMissingCodeMissing(String barcode) {
        assertThat(CanonicalBarcode.of(barcode)).isEqualTo(barcode);
    }

    @ParameterizedTest
    @ValueSource(strings = {"3856021300547", "54490970", "024000011859", "10012345678902"})
    void aGlobalCodeIsNotRestricted(String barcode) {
        assertThat(CanonicalBarcode.isRestrictedCirculation(barcode)).isFalse();
    }
}
