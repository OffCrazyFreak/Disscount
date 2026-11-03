package disscount.watchlistItem.rest;

import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins WatchlistItemDto against watchlistItemDtoSchema. */
class WatchlistWireFormatTest extends FullStackTest {

    @Test
    void aWatchlistItemCarriesEveryFieldAndSendsAnUnsetTimeAsNull() throws Exception {
        User user = newUser("ana");

        JsonNode created = body(mvc.perform(post("/api/watchlist").with(as(user)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"productApiId\":\"3850123456789\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":10}"))
                .andExpect(status().isOk()));
        JsonNode listed = body(mvc.perform(get("/api/watchlist/me").with(as(user))).andExpect(status().isOk())).get(0);

        for (JsonNode item : new JsonNode[]{created, listed}) {
            assertThat(fieldNames(item)).containsExactlyInAnyOrder(
                    "id", "userId", "productApiId", "watchType", "thresholdValue", "lastNotifiedAt", "createdAt", "updatedAt");
            assertThat(item.get("userId").asString()).isEqualTo(user.getId().toString());
            assertThat(item.get("watchType").asString()).isEqualTo("PERCENTAGE");
            assertThat(item.get("thresholdValue").isNumber()).isTrue();
            assertThat(item.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
            // The schema types this as an optional string, not nullable; nothing parses it today.
            assertThat(item.get("lastNotifiedAt").isNull()).isTrue();
        }
    }
}
