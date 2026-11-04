package disscount.storeName.rest;

import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins StoreNameSuggestionDto against storeNameSuggestionDtoSchema. */
class StoreNameWireFormatTest extends FullStackTest {

    @Test
    void aSuggestionIsItsNameOnly() throws Exception {
        String store = "Dućan " + UUID.randomUUID().toString().substring(0, 8);
        // A name is suggested once two accounts used it on a custom card.
        for (String user : new String[]{"ana", "ivo"}) {
            mvc.perform(put("/api/digital-cards/{id}", UUID.randomUUID()).with(as(newUser(user)))
                    .contentType(MediaType.APPLICATION_JSON).content("""
                            {"cardName":"Moja","cardType":"loyalty","storeName":"%s","codeValue":"123",
                             "codeType":"ean_13","cardColor":"#D50000"}
                            """.formatted(store))).andExpect(status().isOk());
        }

        JsonNode found = body(mvc.perform(get("/api/store-names").param("q", store).with(as(newUser("reader"))))
                .andExpect(status().isOk()));

        assertThat(found).singleElement().satisfies(suggestion -> {
            assertThat(fieldNames(suggestion)).containsExactlyInAnyOrderElementsOf(ApiContract.fields("StoreNameSuggestionDto"));
            assertThat(suggestion.get("name").asString()).isEqualTo(store);
        });
    }
}
