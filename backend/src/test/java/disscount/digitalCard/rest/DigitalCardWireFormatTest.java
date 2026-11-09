package disscount.digitalCard.rest;

import java.util.Set;
import disscount.digitalCard.photo.TestImages;
import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

import static disscount.support.WireFormat.DATE;
import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins DigitalCardDto, CardPhotoDto and the config against the digital-card schemas parsing every response. */
class DigitalCardWireFormatTest extends FullStackTest {


    @Test
    void aFullCardCarriesEveryFieldInItsWireShape() throws Exception {
        User owner = newUser("owner");
        UUID cardId = UUID.randomUUID();
        mvc.perform(put("/api/digital-cards/{id}", cardId).with(as(owner)).contentType(MediaType.APPLICATION_JSON).content("""
                {"cardName":"Moja","cardType":"gift","storeName":"Konzum","chainCode":"konzum","codeValue":"3850123456789",
                 "barcodeValue":"12345","codeType":"ean_13","cardColor":"#D50000","note":"Bilješka","validFrom":"2026-03-01",
                 "expiresOn":"2027-03-01","balance":12.5,"balanceUnit":"EUR"}
                """)).andExpect(status().isOk());
        mvc.perform(put("/api/digital-cards/{id}/pin", cardId).with(as(owner)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"pinned\":true}")).andExpect(status().isOk());
        mvc.perform(put("/api/digital-cards/{id}/archive", cardId).with(as(owner)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"archived\":true}")).andExpect(status().isOk());
        mvc.perform(post("/api/digital-cards/used").with(as(owner)).contentType(MediaType.APPLICATION_JSON)
                .content("[{\"id\":\"" + cardId + "\",\"usedAt\":\"2026-03-01T10:15:30Z\"}]")).andExpect(status().isNoContent());
        JsonNode photo = body(mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                .file(new MockMultipartFile("full", "icon.webp", "image/webp", TestImages.webp(32, 32)))
                .with(as(owner))).andExpect(status().isOk()));

        JsonNode card = body(mvc.perform(get("/api/digital-cards/me").with(as(owner))).andExpect(status().isOk())).get(0);

        ApiContract.assertMatches("DigitalCardDto", card);
        assertThat(card.get("cardType").asString()).isEqualTo("gift");
        assertThat(card.get("codeType").asString()).isEqualTo("ean_13");
        assertThat(card.get("validFrom").asString()).matches(DATE);
        assertThat(card.get("balance").isNumber()).isTrue();
        assertThat(card.get("balance").decimalValue()).isEqualByComparingTo("12.50");
        assertThat(card.get("pinnedAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(card.get("archivedAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(card.get("lastUsedAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(card.get("expiresOn").asString()).isEqualTo("2027-03-01");
        assertThat(card.get("balanceUnit").asString()).isEqualTo("EUR");
        assertThat(card.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(card.get("updatedAt").asString()).matches(LOCAL_DATE_TIME);

        ApiContract.assertMatches("CardPhotoDto", photo);
        assertThat(card.get("photos")).singleElement().satisfies(p -> {
            ApiContract.assertMatches("CardPhotoDto", p);
            assertThat(p.get("slot").asString()).isEqualTo("icon");
            assertThat(p.get("sha256").asString()).matches("[0-9a-f]{64}");
        });
    }

    @Test
    void aMinimalCardSendsItsOptionalFieldsAsNullAndAnEmptyPhotoList() throws Exception {
        User owner = newUser("owner");
        UUID cardId = UUID.randomUUID();

        JsonNode card = body(mvc.perform(put("/api/digital-cards/{id}", cardId).with(as(owner))
                .contentType(MediaType.APPLICATION_JSON).content(DigitalCardOwnershipTest.CARD)).andExpect(status().isOk()));

        ApiContract.assertMatches("DigitalCardDto", card);
        for (String field : Set.of("barcodeValue", "note", "validFrom", "expiresOn", "balance", "balanceUnit",
                "pinnedAt", "lastUsedAt", "archivedAt")) {
            assertThat(card.get(field).isNull()).as(field).isTrue();
        }
        assertThat(card.get("photos").isArray()).isTrue();
        assertThat(card.get("photos")).isEmpty();
    }

    @Test
    void theConfigIsOneBoolean() throws Exception {
        JsonNode config = body(mvc.perform(get("/api/digital-cards/config").with(as(newUser("any")))).andExpect(status().isOk()));

        assertThat(fieldNames(config)).containsExactly("photosEnabled");
        assertThat(config.get("photosEnabled").isBoolean()).isTrue();
    }
}
