package disscount.preferences;

import disscount.preferences.PreferencesOwnershipTest.Preference;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;
import disscount.user.User;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import tools.jackson.databind.JsonNode;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The first saved place sets where distances start, so every list keeps the order it was saved in (#743). */
@MigratedPostgres
class SavedListOrderTest extends FullStackTest {

    @Autowired JdbcTemplate jdbc;

    @ParameterizedTest
    @EnumSource(Preference.class)
    void aListComesBackInTheOrderItWasSaved(Preference preference) throws Exception {
        User caller = newUser("caller");

        assertThat(keys(preference, replace(preference, caller, "spar:3", "konzum:1", "lidl:2")))
                .containsExactly("spar:3", "konzum:1", "lidl:2");
        assertThat(keys(preference, mine(preference, caller))).containsExactly("spar:3", "konzum:1", "lidl:2");

        assertThat(keys(preference, replace(preference, caller, "lidl:2", "spar:3", "konzum:1")))
                .containsExactly("lidl:2", "spar:3", "konzum:1");
        assertThat(keys(preference, mine(preference, caller))).containsExactly("lidl:2", "spar:3", "konzum:1");
    }

    // Stored neither in key order nor in sort order, so only ORDER BY sort_order reads them back right.
    @ParameterizedTest
    @EnumSource(Preference.class)
    void storedRowsComeBackBySortOrder(Preference preference) throws Exception {
        User caller = newUser("caller");

        store(preference, caller, "konzum:1", 2);
        store(preference, caller, "spar:3", 0);
        store(preference, caller, "lidl:2", 1);

        assertThat(keys(preference, mine(preference, caller))).containsExactly("spar:3", "lidl:2", "konzum:1");
    }

    // An older image saves every row with the default 0 during a deploy, so ties need their own stable order.
    @ParameterizedTest
    @EnumSource(Preference.class)
    void rowsWithTheSameSortOrderComeBackByKey(Preference preference) throws Exception {
        User caller = newUser("caller");

        store(preference, caller, "spar:3", 0);
        store(preference, caller, "konzum:1", 0);

        assertThat(keys(preference, mine(preference, caller))).containsExactly("konzum:1", "spar:3");
    }

    private void store(Preference preference, User user, String key, int sortOrder) {
        String insert = switch (preference) {
            case PINNED_STORES -> "INSERT INTO app.pinned_store (id, user_id, store_api_id, store_name, sort_order) "
                    + "VALUES (?, ?, ?, 'Trgovina', ?)";
            case PINNED_PLACES -> "INSERT INTO app.pinned_place (id, user_id, place_api_id, place_name, sort_order) "
                    + "VALUES (?, ?, ?, 'Mjesto', ?)";
            case FAVORITE_STORES -> "INSERT INTO app.favorite_store (id, user_id, store_key, sort_order) "
                    + "VALUES (?, ?, ?, ?)";
        };

        jdbc.update(insert, UUID.randomUUID(), user.getId(), key, sortOrder);
    }

    private JsonNode replace(Preference preference, User user, String... keys) throws Exception {
        return body(mvc.perform(put(preference.base + "/bulk").with(as(user))
                .contentType(MediaType.APPLICATION_JSON).content(preference.bulk(keys))).andExpect(status().isOk()));
    }

    private JsonNode mine(Preference preference, User user) throws Exception {
        return body(mvc.perform(get(preference.base + "/me").with(as(user))).andExpect(status().isOk()));
    }

    private static List<String> keys(Preference preference, JsonNode rows) {
        return rows.valueStream().map(row -> row.get(preference.keyField).asString()).toList();
    }
}
