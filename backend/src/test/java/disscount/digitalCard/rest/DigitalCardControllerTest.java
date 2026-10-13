package disscount.digitalCard.rest;

import com.fasterxml.jackson.databind.ObjectMapper;
import disscount.config.SecurityConfig;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.digitalCard.service.DigitalCardPhotoService;
import disscount.digitalCard.service.DigitalCardService;
import disscount.exceptions.ConflictException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;
import disscount.exceptions.TooManyRequestsException;
import disscount.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = {DigitalCardController.class, DigitalCardPhotoController.class})
@Import(SecurityConfig.class)
class DigitalCardControllerTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @MockBean DigitalCardService cardService;
    @MockBean DigitalCardPhotoService photoService;
    @MockBean UserService userService;

    private final UUID userId = UUID.randomUUID();
    private final UUID cardId = UUID.randomUUID();

    private org.springframework.test.web.servlet.request.RequestPostProcessor auth() {
        return jwt().jwt(j -> j.subject(userId.toString()));
    }

    @Test
    void requestsWithoutATokenAre401() throws Exception {
        mvc.perform(get("/api/digital-cards/me")).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/digital-cards/{id}", cardId).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/store-names")).andExpect(status().isUnauthorized());
        verifyNoInteractions(cardService, photoService);
    }

    @Test
    void listsTheCurrentUsersCards() throws Exception {
        when(cardService.list(userId)).thenReturn(List.of(DigitalCardDto.builder()
                .id(cardId).cardName("Konzum").balance(new BigDecimal("5.00")).photos(List.of()).build()));

        mvc.perform(get("/api/digital-cards/me").with(auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(cardId.toString()))
                .andExpect(jsonPath("$[0].cardName").value("Konzum"))
                .andExpect(jsonPath("$[0].balance").value(5.0))
                .andExpect(jsonPath("$[0].photos").isArray());
    }

    @Test
    void saveReturnsTheCardWhenTheBodyIsValid() throws Exception {
        when(cardService.upsert(eq(userId), eq(cardId), any(DigitalCardRequest.class)))
                .thenReturn(DigitalCardDto.builder().id(cardId).cardName("Moja").photos(List.of()).build());

        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cardName").value("Moja"));
    }

    @Test
    void invalidBodyIs400WithCroatianFieldErrors() throws Exception {
        String body = """
                {"cardName":"A","cardType":"vip","storeName":"","codeValue":"","codeType":"nope",
                 "cardColor":"red","note":"%s","balance":-1,"balanceUnit":"eur",
                 "validFrom":"2026-05-01","expiresOn":"2026-04-01"}
                """.formatted("x".repeat(501));

        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.cardName").value("Naziv kartice mora imati od 2 do 60 znakova"))
                .andExpect(jsonPath("$.fieldErrors.cardType").value("Odaberi vrstu kartice"))
                .andExpect(jsonPath("$.fieldErrors.storeName").exists())
                .andExpect(jsonPath("$.fieldErrors.codeValue").value("Upiši broj ili kod kartice"))
                .andExpect(jsonPath("$.fieldErrors.codeType").value("Odaberi vrstu koda"))
                .andExpect(jsonPath("$.fieldErrors.cardColor").value("Odaberi boju"))
                .andExpect(jsonPath("$.fieldErrors.note").value("Bilješka može imati najviše 500 znakova"))
                .andExpect(jsonPath("$.fieldErrors.balance").value("Iznos ne može biti negativan"))
                .andExpect(jsonPath("$.fieldErrors.balanceUnit").value("Valuta nije valjana"))
                .andExpect(jsonPath("$.fieldErrors.expiresOn").value("Kartica ne može isteći prije početka"));
        verifyNoInteractions(cardService);
    }

    @Test
    void balanceWithThreeDecimalsOrTooLargeIsRejected() throws Exception {
        for (String balance : List.of("1.234", "1000000.01")) {
            mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(validBody().replace("\"balance\":12.5", "\"balance\":" + balance)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.fieldErrors.balance").exists());
        }
    }

    @Test
    void notFoundIs404() throws Exception {
        when(cardService.get(userId, cardId)).thenThrow(new NotFoundException("Kartica nije pronađena"));
        when(cardService.upsert(eq(userId), eq(cardId), any())).thenThrow(new NotFoundException("Kartica nije pronađena"));

        mvc.perform(get("/api/digital-cards/{id}", cardId).with(auth()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.detail").value("Kartica nije pronađena"));
        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isNotFound());
    }

    @Test
    void cardCapIs409() throws Exception {
        when(cardService.upsert(eq(userId), eq(cardId), any()))
                .thenThrow(new ConflictException("Dosegnut je najveći broj kartica"));

        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Dosegnut je najveći broj kartica"));
    }

    @Test
    void malformedIdIs400() throws Exception {
        mvc.perform(get("/api/digital-cards/not-a-uuid").with(auth())).andExpect(status().isBadRequest());
    }

    @Test
    void pinNeedsABooleanAndDeleteAnswers204() throws Exception {
        mvc.perform(put("/api/digital-cards/{id}/pin", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.pinned").exists());
        mvc.perform(delete("/api/digital-cards/{id}", cardId).with(auth())).andExpect(status().isNoContent());
        mvc.perform(post("/api/digital-cards/used").with(auth()).contentType(MediaType.APPLICATION_JSON)
                        .content("[{\"id\":\"" + cardId + "\",\"usedAt\":\"2026-10-12T10:00:00Z\"}]"))
                .andExpect(status().isNoContent());
    }

    @Test
    void configReportsWhetherPhotosAreEnabled() throws Exception {
        when(cardService.photosEnabled()).thenReturn(true);

        mvc.perform(get("/api/digital-cards/config").with(auth()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photosEnabled").value(true));
    }

    @Test
    void photoUploadErrorsKeepTheirStatusAndRetryAfter() throws Exception {
        MockMultipartFile full = new MockMultipartFile("full", "f.webp", "image/webp", new byte[]{1});
        when(photoService.upload(eq(userId), eq(cardId), eq("icon"), any(), any()))
                .thenThrow(new ServiceUnavailableException("Slike trenutno nisu dostupne"))
                .thenThrow(new TooManyRequestsException("Previše", 42));

        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                        .file(full).with(auth()))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.detail").value("Slike trenutno nisu dostupne"));
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                        .file(full).with(auth()))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().string("Retry-After", "42"));
    }

    @Test
    void photoUploadWithoutTheFullPartIs400() throws Exception {
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon").with(auth()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void photoDownloadRejectsAnUnknownSize() throws Exception {
        mvc.perform(get("/api/digital-cards/{id}/photos/front?size=huge", cardId).with(auth()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void usedBatchIsValidatedBeforeTheService() throws Exception {
        String valid = "{\"id\":\"" + cardId + "\",\"usedAt\":\"2026-10-12T10:00:00Z\"}";
        String fiftyOne = "[" + String.join(",", java.util.Collections.nCopies(51, valid)) + "]";

        for (String body : List.of("[]", "[null]", "[" + valid + ",null]", "[{\"id\":\"" + cardId + "\"}]", fiftyOne)) {
            mvc.perform(post("/api/digital-cards/used").with(auth())
                            .contentType(MediaType.APPLICATION_JSON).content(body))
                    .andExpect(status().isBadRequest());
        }
        verifyNoInteractions(cardService);
    }

    @Test
    void nulAndPaddedNamesAreFieldErrorsOnTheRightField() throws Exception {
        String nul = validBody().replace("Moja kartica", "Moja\\u0000kartica");
        String padded = validBody().replace("\"Konzum\"", "\"  K \"");

        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(nul))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.cardName").value("Tekst sadrži nedopušten znak"));
        mvc.perform(put("/api/digital-cards/{id}", cardId).with(auth())
                        .contentType(MediaType.APPLICATION_JSON).content(padded))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.storeName").value("Naziv trgovine mora imati od 2 do 60 znakova"));
        verifyNoInteractions(cardService);
    }

    @Test
    void photoRevalidationHonoursWeakAndMultiValueIfNoneMatch() throws Exception {
        String sha = "ab".repeat(32);
        when(photoService.currentSha256(userId, cardId, "front")).thenReturn(sha);

        for (String header : List.of("\"" + sha + "\"", "W/\"" + sha + "\"", "\"other\", \"" + sha + "\"")) {
            mvc.perform(get("/api/digital-cards/{id}/photos/front", cardId).with(auth())
                            .header("If-None-Match", header))
                    .andExpect(status().isNotModified())
                    .andExpect(header().string("ETag", "\"" + sha + "\""));
        }
    }

    private String validBody() throws Exception {
        DigitalCardRequest r = new DigitalCardRequest();
        r.setCardName("Moja kartica");
        r.setCardType("loyalty");
        r.setStoreName("Konzum");
        r.setChainCode("konzum");
        r.setCodeValue("3850123456789");
        r.setCodeType("ean_13");
        r.setCardColor("#D50000");
        r.setBalance(new BigDecimal("12.5"));
        r.setBalanceUnit("EUR");
        return json.writeValueAsString(r);
    }
}
