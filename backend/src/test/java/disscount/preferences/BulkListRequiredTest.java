package disscount.preferences;

import java.util.stream.Collectors;
import java.util.stream.IntStream;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A bulk replace without its list is a validation 400, not the NullPointerException the service would throw. */
class BulkListRequiredTest extends FullStackTest {

    @ParameterizedTest
    @ValueSource(strings = {"/api/pinned-stores/bulk", "/api/pinned-places/bulk", "/api/favorite-stores/bulk"})
    void aBodyWithoutTheListIsAValidationError(String url) throws Exception {
        User caller = newUser("caller");

        mvc.perform(put(url).with(as(caller)).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/pinned-stores/bulk", "/api/pinned-places/bulk", "/api/favorite-stores/bulk"})
    void anExplicitNullListIsAValidationError(String url) throws Exception {
        User caller = newUser("caller");
        String field = url.contains("places") ? "places" : "stores";

        mvc.perform(put(url).with(as(caller)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"" + field + "\":null}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"));
    }

    @ParameterizedTest
    @ValueSource(strings = {"/api/pinned-stores/bulk", "/api/pinned-places/bulk", "/api/favorite-stores/bulk"})
    void aNullEntryIsAValidationError(String url) throws Exception {
        User caller = newUser("caller");
        String field = url.contains("places") ? "places" : "stores";

        mvc.perform(put(url).with(as(caller)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"" + field + "\":[null]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.type").value("urn:disscount:validation"));
    }

    @Test
    void aFiftyFirstPinIsAFieldErrorThatStatesTheLimit() throws Exception {
        User caller = newUser("caller");
        String places = IntStream.range(0, 51)
                .mapToObj(index -> "{\"placeApiId\":\"mjesto-" + index + "\",\"placeName\":\"Mjesto " + index + "\"}")
                .collect(Collectors.joining(",", "{\"places\":[", "]}"));

        mvc.perform(put("/api/pinned-places/bulk").with(as(caller)).contentType(MediaType.APPLICATION_JSON).content(places))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.places").value("Možeš prikvačiti najviše 50 mjesta."));
    }
}
