package disscount.preferences;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** These take no resource id, so ownership means one caller's bulk write and read never reach another caller's rows. */
class PreferencesOwnershipTest extends FullStackTest {

    enum Preference {
        PINNED_STORES("/api/pinned-stores", "stores", "storeApiId",
                "{\"storeApiId\":\"%s\",\"storeName\":\"Trgovina\"}"),
        PINNED_PLACES("/api/pinned-places", "places", "placeApiId",
                "{\"placeApiId\":\"%s\",\"placeName\":\"Mjesto\"}"),
        FAVORITE_STORES("/api/favorite-stores", "stores", "storeKey",
                "{\"storeKey\":\"%s\"}");

        final String base;
        final String listField;
        final String keyField;
        final String entry;

        Preference(String base, String listField, String keyField, String entry) {
            this.base = base;
            this.listField = listField;
            this.keyField = keyField;
            this.entry = entry;
        }

        String bulk(String... keys) {
            StringBuilder entries = new StringBuilder();
            for (String key : keys) {
                if (!entries.isEmpty()) entries.append(',');
                entries.append(entry.formatted(key));
            }
            return "{\"" + listField + "\":[" + entries + "]}";
        }
    }

    private JsonNode replace(Preference preference, User user, String... keys) throws Exception {
        return body(mvc.perform(put(preference.base + "/bulk").with(as(user))
                .contentType(MediaType.APPLICATION_JSON).content(preference.bulk(keys))).andExpect(status().isOk()));
    }

    private JsonNode mine(Preference preference, User user) throws Exception {
        return body(mvc.perform(get(preference.base + "/me").with(as(user))).andExpect(status().isOk()));
    }

    @ParameterizedTest
    @EnumSource(Preference.class)
    void aBulkReplaceAndTheListTouchOnlyTheCallersRows(Preference preference) throws Exception {
        User owner = newUser("owner");
        User stranger = newUser("stranger");
        replace(preference, owner, "konzum:1", "lidl:2");

        replace(preference, stranger, "spar:3");
        assertThat(mine(preference, stranger)).singleElement()
                .satisfies(row -> assertThat(row.get(preference.keyField).asString()).isEqualTo("spar:3"));

        replace(preference, stranger);
        assertThat(mine(preference, stranger)).isEmpty();
        assertThat(mine(preference, owner)).extracting(row -> row.get(preference.keyField).asString())
                .containsExactlyInAnyOrder("konzum:1", "lidl:2");
    }

    @ParameterizedTest
    @EnumSource(Preference.class)
    void bothRoutesNeedAToken(Preference preference) throws Exception {
        mvc.perform(get(preference.base + "/me")).andExpect(status().isUnauthorized());
        mvc.perform(put(preference.base + "/bulk").contentType(MediaType.APPLICATION_JSON).content(preference.bulk()))
                .andExpect(status().isUnauthorized());
    }
}
