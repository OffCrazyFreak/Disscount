package disscount.productImage.rest;

import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.dao.ProductImageSetRepository;
import disscount.productImage.domain.ImageSource;
import disscount.productImage.domain.ImageStatus;
import disscount.productImage.domain.ProductImage;
import disscount.productImage.domain.ProductImageSet;
import disscount.support.FullStackTest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import tools.jackson.databind.JsonNode;

import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins the public and admin photo DTOs against product-image.ts. */
class ProductImageWireFormatTest extends FullStackTest {

    @Autowired ProductImageRepository images;
    @Autowired ProductImageSetRepository sets;

    private String ean;
    private UUID imageId;

    @BeforeEach
    void setUp() {
        ean = String.valueOf(ThreadLocalRandom.current().nextLong(1_000_000_000_000L, 9_999_999_999_999L));
        imageId = images.save(ProductImage.builder().ean(ean).source(ImageSource.USER).status(ImageStatus.VERIFIED)
                .fullKey("products/" + ean + "/full.jpg").thumbKey("products/" + ean + "/thumb.jpg").build()).getId();
        sets.save(ProductImageSet.builder().ean(ean).mainImageId(imageId).storeListings(3).chainCount(2).build());
    }

    @Test
    void thePublicPhotoListIsTheEanAndItsPhotos() throws Exception {
        JsonNode photos = body(mvc.perform(get("/api/products/{ean}/images", ean)).andExpect(status().isOk()));

        assertThat(fieldNames(photos)).containsExactlyInAnyOrder("ean", "images");
        assertThat(photos.get("images")).singleElement().satisfies(image -> {
            assertThat(fieldNames(image)).containsExactlyInAnyOrder("id", "fullUrl", "thumbUrl", "source", "status");
            assertThat(image.get("source").asString()).isEqualTo("USER");
            assertThat(image.get("status").asString()).isEqualTo("VERIFIED");
        });
    }

    @Test
    void thumbnailsAreAMapFromEanToUrl() throws Exception {
        JsonNode thumbnails = body(mvc.perform(get("/api/products/images/thumbnails").param("eans", ean))
                .andExpect(status().isOk()));

        assertThat(fieldNames(thumbnails)).containsExactly("thumbnails");
        assertThat(thumbnails.get("thumbnails").get(ean).isString()).isTrue();
    }

    @Test
    void theListedEansAreAnArray() throws Exception {
        JsonNode listed = body(mvc.perform(get("/api/products/catalog/eans")).andExpect(status().isOk()));

        assertThat(fieldNames(listed)).containsExactly("eans");
        assertThat(listed.get("eans").isArray()).isTrue();
    }

    @Test
    void theAdminProductViewCarriesEveryField() throws Exception {
        mvc.perform(post("/api/admin/product-images/{ean}/reviewed", ean).with(as(newAdmin()))).andExpect(status().isOk());

        JsonNode product = body(mvc.perform(get("/api/admin/product-images/{ean}", ean).with(as(newAdmin())))
                .andExpect(status().isOk()));

        assertThat(fieldNames(product)).containsExactlyInAnyOrder("ean", "name", "brand", "storeListings", "chainCount",
                "mainImageId", "pinned", "needsReview", "reviewedAt", "offDetailsFetchedAt", "images");
        assertThat(product.get("reviewedAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(product.get("images")).singleElement().satisfies(image -> {
            assertThat(fieldNames(image)).containsExactlyInAnyOrder("id", "source", "status", "lang", "previewUrl",
                    "fullUrl", "originalUrl", "rendered", "main", "rotation", "crop", "originalWidth", "originalHeight",
                    "reportCount", "createdAt");
            assertThat(image.get("main").asBoolean()).isTrue();
            assertThat(image.get("crop").isNull()).isTrue();
            assertThat(image.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        });
    }

    @Test
    void theAdminQueueIsOurOwnPageShape() throws Exception {
        // The unreviewed queue sorts by store listings, and no other test lists a product this widely.
        sets.save(sets.findById(ean).map(set -> {
            set.setStoreListings(Integer.MAX_VALUE);
            return set;
        }).orElseThrow());

        JsonNode page = body(mvc.perform(get("/api/admin/product-images/queue").param("size", "1").with(as(newAdmin())))
                .andExpect(status().isOk()));

        assertThat(fieldNames(page)).containsExactlyInAnyOrder("items", "total", "page", "size", "reviewedCount");
        assertThat(page.get("page").asInt()).isZero();
        assertThat(page.get("size").asInt()).isEqualTo(1);
        assertThat(page.get("items")).singleElement().satisfies(item -> {
            assertThat(fieldNames(item)).containsExactlyInAnyOrder("ean", "name", "brand", "storeListings", "chainCount",
                    "previewUrl", "imageCount", "pendingCount", "reportedCount", "needsReview", "reviewedAt");
            assertThat(item.get("ean").asString()).isEqualTo(ean);
            assertThat(item.get("previewUrl").isString()).isTrue();
        });
    }
}
