package disscount.productimage.catalog;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CatalogArchiveReaderTest {

    @Test
    void joinsPricesToBarcodesWhateverTheEntryOrder() throws IOException {
        byte[] zip = zip(
                "konzum/", null,
                // Prices before products: the archive does not promise an order.
                "konzum/prices.csv", "store_id,product_id,price\nS1,1,1.00\nS2,1,1.10\nS1,2,2.00\nS1,3,3.00\n",
                "konzum/products.csv", "product_id,barcode,name,brand\n"
                        + "1,3856021300547,\"ČIPI ČIPS 200g, FRANCK\",FRANCK\n"
                        + "2,2012345678903,VAGANO MESO,\n"
                        + "3,3856021300548,KRIVI KONTROLNI BROJ,\n",
                "spar/products.csv", "product_id,barcode,name,brand\nA,3856021300547,Čipi čips 200 g,Franck\n",
                "spar/prices.csv", "store_id,product_id,price\nX,A,1.05\n",
                "konzum/stores.csv", "store_id\nS1\n");

        Map<String, CatalogArchiveReader.Entry> catalog = CatalogArchiveReader.read(new ByteArrayInputStream(zip));

        assertThat(catalog).containsOnlyKeys("3856021300547");
        CatalogArchiveReader.Entry chips = catalog.get("3856021300547");
        assertThat(chips.storeListings()).isEqualTo(3);
        assertThat(chips.chainCount()).isEqualTo(2);
        assertThat(chips.name()).isIn("ČIPI ČIPS 200g, FRANCK", "Čipi čips 200 g");
    }

    @Test
    void aCodePaddedDifferentlyByTwoChainsIsOneProduct() throws IOException {
        byte[] zip = zip(
                "konzum/products.csv", "product_id,barcode,name,brand\n1,0012345678905,PAHULJICE,\n",
                "konzum/prices.csv", "store_id,product_id,price\nS1,1,1.00\n",
                "spar/products.csv", "product_id,barcode,name,brand\nA,012345678905,Pahuljice,\n",
                "spar/prices.csv", "store_id,product_id,price\nX,A,1.05\n");

        Map<String, CatalogArchiveReader.Entry> catalog = CatalogArchiveReader.read(new ByteArrayInputStream(zip));

        assertThat(catalog).containsOnlyKeys("12345678905");
        assertThat(catalog.get("12345678905").chainCount()).isEqualTo(2);
    }

    @Test
    void aGtinWithItsLeadingZerosStrippedIsStillAPublicGtin() {
        // UPC-A 012345678905 and Del Monte 024000011859, as cijene-api sends them.
        assertThat(Barcodes.isPublicGtin("12345678905")).isTrue();
        assertThat(Barcodes.isPublicGtin("24000011859")).isTrue();
        // GTIN-13 0000123456784 stripped to 9 digits.
        assertThat(Barcodes.isPublicGtin("123456784")).isTrue();
        assertThat(Barcodes.isPublicGtin("12345678906")).isFalse();
        assertThat(Barcodes.isPublicGtin("1234567")).isFalse();
    }

    @Test
    void barcodeRulesKeepRealGtinsOnly() {
        assertThat(Barcodes.isPublicGtin("3856021300547")).isTrue();
        assertThat(Barcodes.isPublicGtin("20123956")).isTrue();
        assertThat(Barcodes.isPublicGtin("3856021300548")).isFalse();
        assertThat(Barcodes.isPublicGtin("2012345678903")).isFalse();
        assertThat(Barcodes.isPublicGtin("12345")).isFalse();
        assertThat(Barcodes.isEanShape("٠٠١٢٣٤٥٦٧٨٩٠٥")).isFalse();
        assertThat(Barcodes.matchKey("0012345678905")).isEqualTo("12345678905");
        assertThat(CsvLine.split("a,\"b, \"\"c\"\"\",d")).containsExactly("a", "b, \"c\"", "d");
    }

    private static byte[] zip(String... namesAndContents) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(out)) {
            for (int i = 0; i < namesAndContents.length; i += 2) {
                zip.putNextEntry(new ZipEntry(namesAndContents[i]));
                if (namesAndContents[i + 1] != null) {
                    zip.write(namesAndContents[i + 1].getBytes(StandardCharsets.UTF_8));
                }
                zip.closeEntry();
            }
        }
        return out.toByteArray();
    }
}
