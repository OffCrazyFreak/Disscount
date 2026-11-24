package disscount.preferences;

import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import static disscount.support.WireFormat.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins the favourite store, pinned store and pinned place DTOs against favorite-store.ts and preferences.ts. */
class PreferencesWireFormatTest extends FullStackTest {

    private JsonNode firstRow(String base, String bulk, User user) throws Exception {
        JsonNode written = body(mvc.perform(put(base + "/bulk").with(as(user)).contentType(MediaType.APPLICATION_JSON)
                .content(bulk)).andExpect(status().isOk()));
        JsonNode read = body(mvc.perform(get(base + "/me").with(as(user))).andExpect(status().isOk()));
        assertThat(fieldNames(written.get(0))).isEqualTo(fieldNames(read.get(0)));
        return read.get(0);
    }

    @Test
    void aFavouriteStoreIsItsIdAndKeyOnly() throws Exception {
        JsonNode row = firstRow("/api/favorite-stores", "{\"stores\":[{\"storeKey\":\"konzum:1\"}]}", newUser("ana"));

        ApiContract.assertMatches("FavoriteStoreDto", row);
        assertThat(row.get("id").asString()).matches(UUID);
        assertThat(row.get("storeKey").asString()).isEqualTo("konzum:1");
    }

    @Test
    void aPinnedStoreCarriesItsOwner() throws Exception {
        User user = newUser("ana");
        JsonNode row = firstRow("/api/pinned-stores",
                "{\"stores\":[{\"storeApiId\":\"konzum:1\",\"storeName\":\"Konzum Ilica\"}]}", user);

        ApiContract.assertMatches("PinnedStoreDto", row);
        assertThat(row.get("userId").asString()).isEqualTo(user.getId().toString());
    }

    @Test
    void aPinnedPlaceCarriesItsOwner() throws Exception {
        User user = newUser("ana");
        JsonNode row = firstRow("/api/pinned-places",
                "{\"places\":[{\"placeApiId\":\"10000\",\"placeName\":\"Zagreb\"}]}", user);

        ApiContract.assertMatches("PinnedPlaceDto", row);
        assertThat(row.get("userId").asString()).isEqualTo(user.getId().toString());
    }
}
