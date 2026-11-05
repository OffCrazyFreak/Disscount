package disscount.productImage.off;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.GZIPOutputStream;

import tools.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class OpenFoodFactsParsingTest {

    @Test
    void keepsOneFrontPerPhotoPreferringCroatianAndSkipsRawsUsedByFronts() throws IOException {
        String images = """
                {
                  "1": {"sizes": {}}, "2": {"sizes": {}}, "44": {"sizes": {}}, "117": {"sizes": {}},
                  "front_en": {"rev": "3881", "imgid": "117"},
                  "front_de": {"rev": "100", "imgid": "117"},
                  "front_hr": {"rev": "3570", "imgid": "44"},
                  "ingredients_hr": {"rev": "12", "imgid": "2"}
                }
                """;

        OffProductPhotos photos = OffProductPhotos.parse(new ObjectMapper().readTree(images));

        assertThat(photos.fronts()).extracting(OffProductPhotos.Photo::externalKey).containsExactly("front_hr", "front_en");
        assertThat(photos.raws()).extracting(OffProductPhotos.Photo::externalKey).containsExactly("raw:2", "raw:1");
    }

    @Test
    void aFrontWhoseRevIsNotAScalarStillParses() throws IOException {
        String images = """
                {"44": {"sizes": {}}, "front_hr": {"rev": {"unexpected": true}, "imgid": 44}}
                """;

        OffProductPhotos photos = OffProductPhotos.parse(new ObjectMapper().readTree(images));

        assertThat(photos.fronts()).singleElement().satisfies(front -> {
            assertThat(front.rev()).isEmpty();
            assertThat(front.imgid()).isEqualTo("44");
        });
    }

    @Test
    void buildsUrlsFromTheDocumentedFolderLayout() {
        assertThat(OffImageUrls.full("8076800195057", "front_hr", "3570"))
                .isEqualTo("https://images.openfoodfacts.org/images/products/807/680/019/5057/front_hr.3570.full.jpg");
        assertThat(OffImageUrls.preview("8076800195057", "raw:100", null))
                .isEqualTo("https://images.openfoodfacts.org/images/products/807/680/019/5057/100.400.jpg");
        assertThat(OffImageUrls.full("20123956", "raw:1", null))
                .isEqualTo("https://images.openfoodfacts.org/images/products/000/002/012/3956/1.jpg");
    }

    @Test
    void exportMatchesBarcodesIgnoringLeadingZeros() throws IOException {
        String tsv = "code\tproduct_name\timage_url\n"
                + "0008076800195057\tSpaghetti\thttps://images.openfoodfacts.org/images/products/807/680/019/5057/front_en.3881.400.jpg\n"
                + "5449000000996\tCola\thttps://images.openfoodfacts.org/images/products/544/900/000/0996/front_en.1129.400.jpg\n"
                + "3856021300547\tNo photo\t\n";

        Map<String, OffExportReader.Front> fronts = OffExportReader.read(gzip(tsv),
                Map.of("8076800195057", "8076800195057", "3856021300547", "3856021300547"));

        assertThat(fronts).containsOnlyKeys("8076800195057");
        assertThat(fronts.get("8076800195057")).isEqualTo(new OffExportReader.Front("front_en", "3881", "en"));
    }

    private static ByteArrayInputStream gzip(String text) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (GZIPOutputStream gz = new GZIPOutputStream(out)) {
            gz.write(text.getBytes(StandardCharsets.UTF_8));
        }
        return new ByteArrayInputStream(out.toByteArray());
    }
}
