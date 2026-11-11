package disscount.preferences;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.springframework.http.MediaType;

import disscount.support.FullStackTest;
import disscount.user.User;

/** A bulk replace checks the new list before it deletes the saved one, so a refused save loses nothing. */
class BulkReplaceDuplicateTest extends FullStackTest {

    @ParameterizedTest
    @CsvSource({
            "/api/pinned-stores, stores, storeApiId, storeName",
            "/api/pinned-places, places, placeApiId, placeName"})
    void aDuplicateIsRefusedAndTheSavedListStays(String base, String field, String id, String name) throws Exception {
        User caller = newUser("caller");

        mvc.perform(put(base + "/bulk").with(as(caller)).contentType(MediaType.APPLICATION_JSON)
                        .content(body(field, id, name, "1")))
                .andExpect(status().isOk());

        mvc.perform(put(base + "/bulk").with(as(caller)).contentType(MediaType.APPLICATION_JSON)
                        .content(body(field, id, name, "2", "2")))
                .andExpect(status().isBadRequest());

        mvc.perform(get(base + "/me").with(as(caller)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0]." + id).value("1"));
    }

    private static String body(String field, String id, String name, String... ids) {
        StringBuilder entries = new StringBuilder();
        for (String value : ids) {
            if (!entries.isEmpty()) entries.append(',');
            entries.append("{\"%s\":\"%s\",\"%s\":\"Mjesto %s\"}".formatted(id, value, name, value));
        }
        return "{\"%s\":[%s]}".formatted(field, entries);
    }
}
