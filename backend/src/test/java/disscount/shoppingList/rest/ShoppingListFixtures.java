package disscount.shoppingList.rest;

import disscount.user.domain.User;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.ObjectMapper;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Builds lists through the API as their owner would, so the fixtures go through the same rules as the tests. */
record ShoppingListFixtures(MockMvc mvc, ObjectMapper json) {

    String createList(User owner, String title, String linkAccess) throws Exception {
        String body = linkAccess == null
                ? "{\"title\":\"" + title + "\"}"
                : "{\"title\":\"" + title + "\",\"linkAccess\":\"" + linkAccess + "\"}";
        return idOf(mvc.perform(post("/api/shopping-lists").with(token(owner))
                .contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    String addItem(User owner, String listId, String name) throws Exception {
        return idOf(mvc.perform(post("/api/shopping-lists/{id}/items", listId).with(token(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"" + name + "\"}")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString());
    }

    void share(User owner, String listId, String title, String linkAccess) throws Exception {
        mvc.perform(put("/api/shopping-lists/{id}", listId).with(token(owner)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"title\":\"" + title + "\",\"linkAccess\":\"" + linkAccess + "\"}")).andExpect(status().isOk());
    }

    private String idOf(String body) {
        return json.readTree(body).get("id").asString();
    }

    private static org.springframework.test.web.servlet.request.RequestPostProcessor token(User user) {
        return jwt().jwt(j -> j.subject(user.getId().toString()));
    }
}
