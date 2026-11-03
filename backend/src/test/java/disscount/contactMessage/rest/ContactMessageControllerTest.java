package disscount.contactMessage.rest;

import disscount.config.SecurityConfig;
import disscount.contactMessage.service.ContactMessageService;
import disscount.contactMessage.service.ContactRateLimiter;
import disscount.user.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ContactMessageController.class)
@Import({SecurityConfig.class, ContactRateLimiter.class})
class ContactMessageControllerTest {

    private static final String BODY = "{\"subject\":\"Pozdrav\",\"message\":\"Poruka\"}";
    private static final String CLOUDFLARE_EDGE = "172.70.1.2";

    @Autowired MockMvc mvc;
    @MockitoBean ContactMessageService contactMessageService;
    @MockitoBean UserService userService;

    private static MockHttpServletRequestBuilder contactFrom(String visitor) {
        return post("/api/contact")
                .contentType(MediaType.APPLICATION_JSON)
                .content(BODY)
                .header("X-Forwarded-For", visitor + ", " + CLOUDFLARE_EDGE)
                .header("CF-Connecting-IP", visitor);
    }

    @Test
    void theSixthMessageInAnHourFromOneVisitorIs429() throws Exception {
        for (int i = 0; i < 5; i++) {
            mvc.perform(contactFrom("93.140.10.20")).andExpect(status().isOk());
        }

        mvc.perform(contactFrom("93.140.10.20"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists(HttpHeaders.RETRY_AFTER));

        mvc.perform(contactFrom("93.140.10.21")).andExpect(status().isOk());
        verify(contactMessageService, times(6)).create(any());
    }
}
