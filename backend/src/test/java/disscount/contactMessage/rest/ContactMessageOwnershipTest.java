package disscount.contactMessage.rest;

import disscount.contactMessage.dao.ContactMessageRepository;
import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A sender can only write as themselves: the sender comes from the token, never the body.
 * Reading messages back is admin only and is pinned in AdminGatingTest.
 */
class ContactMessageOwnershipTest extends FullStackTest {

    @Autowired ContactMessageRepository messages;

    // A fresh address per request, so the per-IP limit never trips across tests sharing the context.
    private static MockHttpServletRequestBuilder submit(String body) {
        String ip = "10.0." + ThreadLocalRandom.current().nextInt(256) + "." + ThreadLocalRandom.current().nextInt(256);
        return post("/api/contact").contentType(MediaType.APPLICATION_JSON).content(body)
                .with(request -> {
                    request.setRemoteAddr(ip);
                    return request;
                });
    }

    @Test
    void theSenderIsTheTokensUserWhateverTheBodyClaims() throws Exception {
        User sender = newUser("sender");
        User someoneElse = newUser("someone");

        JsonNode created = body(mvc.perform(submit(
                "{\"subject\":\"Pitanje\",\"message\":\"Poruka\",\"userId\":\"" + someoneElse.getId() + "\"}").with(as(sender)))
                .andExpect(status().isOk()));

        assertThat(created.get("userId").asString()).isEqualTo(sender.getId().toString());
    }

    @Test
    void anAnonymousMessageHasNoSender() throws Exception {
        User someoneElse = newUser("someone");

        JsonNode created = body(mvc.perform(submit(
                "{\"subject\":\"Pitanje\",\"message\":\"Poruka\",\"userId\":\"" + someoneElse.getId() + "\"}"))
                .andExpect(status().isOk()));

        assertThat(created.get("userId").isNull()).isTrue();
    }

    // A bot gets a success so it has no reason to retry, but nothing is stored.
    @Test
    void aHoneypotHitIsA204WithAnEmptyBodyAndStoresNothing() throws Exception {
        long before = messages.count();

        mvc.perform(submit("{\"subject\":\"Pitanje\",\"message\":\"Poruka\",\"honeypot\":\"x\"}").with(as(newUser("bot"))))
                .andExpect(status().isNoContent())
                .andExpect(content().string(""));

        assertThat(messages.count()).isEqualTo(before);
    }
}
