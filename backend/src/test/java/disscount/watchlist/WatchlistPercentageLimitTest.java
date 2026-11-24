package disscount.watchlist;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** The limit is checked across two fields, so this pins that the form still gets it on the threshold field. */
class WatchlistPercentageLimitTest extends FullStackTest {

    @Test
    void aPercentageAlertOverAHundredIsAFieldErrorOnTheThreshold() throws Exception {
        User user = newUser("ana");

        mvc.perform(post("/api/watchlist").with(as(user)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"productApiId\":\"3850123456789\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":500}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.thresholdValue").value("Popust u postotku može biti najviše 100%."));
    }
}
