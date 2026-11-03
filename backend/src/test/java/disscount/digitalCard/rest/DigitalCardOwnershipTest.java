package disscount.digitalCard.rest;

import disscount.digitalCard.photo.TestImages;
import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Another user's card and its photos look exactly like an id nobody has used: 404 everywhere. */
class DigitalCardOwnershipTest extends FullStackTest {

    static final String CARD = """
            {"cardName":"Moja kartica","cardType":"loyalty","storeName":"Konzum","chainCode":"konzum",
             "codeValue":"3850123456789","codeType":"ean_13","cardColor":"#D50000"}
            """;

    private User owner;
    private User stranger;
    private UUID cardId;

    @BeforeEach
    void setUp() throws Exception {
        owner = newUser("owner");
        stranger = newUser("stranger");
        cardId = UUID.randomUUID();
        mvc.perform(put("/api/digital-cards/{id}", cardId).with(as(owner))
                .contentType(MediaType.APPLICATION_JSON).content(CARD)).andExpect(status().isOk());
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                .file(new MockMultipartFile("full", "icon.webp", "image/webp", TestImages.webp(32, 32)))
                .with(as(owner))).andExpect(status().isOk());
    }

    @Test
    void aStrangerGets404OnEveryCardRoute() throws Exception {
        mvc.perform(get("/api/digital-cards/{id}", cardId).with(as(stranger))).andExpect(status().isNotFound());
        mvc.perform(put("/api/digital-cards/{id}", cardId).with(as(stranger))
                .contentType(MediaType.APPLICATION_JSON).content(CARD)).andExpect(status().isNotFound());
        mvc.perform(put("/api/digital-cards/{id}/pin", cardId).with(as(stranger))
                .contentType(MediaType.APPLICATION_JSON).content("{\"pinned\":true}")).andExpect(status().isNotFound());
        mvc.perform(put("/api/digital-cards/{id}/archive", cardId).with(as(stranger))
                .contentType(MediaType.APPLICATION_JSON).content("{\"archived\":true}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/digital-cards/{id}", cardId).with(as(stranger))).andExpect(status().isNotFound());

        JsonNode card = body(mvc.perform(get("/api/digital-cards/{id}", cardId).with(as(owner))).andExpect(status().isOk()));
        assertThat(card.get("pinnedAt").isNull()).isTrue();
        assertThat(card.get("archivedAt").isNull()).isTrue();
        assertThat(card.get("photos")).hasSize(1);
    }

    @Test
    void aStrangersUsedStampIsAcceptedButTouchesNothing() throws Exception {
        mvc.perform(post("/api/digital-cards/used").with(as(stranger)).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"id\":\"" + cardId + "\",\"usedAt\":\"2026-03-01T10:15:30Z\"}]"))
                .andExpect(status().isNoContent());

        JsonNode card = body(mvc.perform(get("/api/digital-cards/{id}", cardId).with(as(owner))).andExpect(status().isOk()));
        assertThat(card.get("lastUsedAt").isNull()).isTrue();

        mvc.perform(post("/api/digital-cards/used").with(as(owner)).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"id\":\"" + cardId + "\",\"usedAt\":\"2026-03-01T10:15:30Z\"}]"))
                .andExpect(status().isNoContent());
        card = body(mvc.perform(get("/api/digital-cards/{id}", cardId).with(as(owner))).andExpect(status().isOk()));
        assertThat(card.get("lastUsedAt").isNull()).isFalse();
    }

    @Test
    void aStrangerGets404OnEveryPhotoRoute() throws Exception {
        mvc.perform(get("/api/digital-cards/{id}/photos/{slot}", cardId, "icon").with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/digital-cards/{id}/photos/{slot}", cardId, "icon").with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                        .file(new MockMultipartFile("full", "icon.webp", "image/webp", TestImages.webp(32, 32)))
                        .with(as(stranger)))
                .andExpect(status().isNotFound());

        mvc.perform(get("/api/digital-cards/{id}/photos/{slot}", cardId, "icon").with(as(owner))).andExpect(status().isOk());
    }

    @Test
    void theCardListReturnsOnlyTheCallersCards() throws Exception {
        JsonNode strangersCards = body(mvc.perform(get("/api/digital-cards/me").with(as(stranger))).andExpect(status().isOk()));
        assertThat(strangersCards).isEmpty();

        JsonNode ownersCards = body(mvc.perform(get("/api/digital-cards/me").with(as(owner))).andExpect(status().isOk()));
        assertThat(ownersCards).singleElement().satisfies(card -> assertThat(card.get("id").asString()).isEqualTo(cardId.toString()));
    }

    @Test
    void cardRoutesNeedAToken() throws Exception {
        mvc.perform(get("/api/digital-cards/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/digital-cards/{id}", cardId)).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/digital-cards/{id}/photos/{slot}", cardId, "icon")).andExpect(status().isUnauthorized());
    }
}
