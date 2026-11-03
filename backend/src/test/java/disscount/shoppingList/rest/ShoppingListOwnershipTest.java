package disscount.shoppingList.rest;

import disscount.support.FullStackTest;
import disscount.user.domain.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A private list is invisible to everyone but its owner: every by-id route answers 404, never 403. */
class ShoppingListOwnershipTest extends FullStackTest {

    private ShoppingListFixtures lists;
    private User owner;
    private User stranger;
    private String listId;
    private String itemId;

    @BeforeEach
    void setUp() throws Exception {
        lists = new ShoppingListFixtures(mvc, json);
        owner = newUser("owner");
        stranger = newUser("stranger");
        listId = lists.createList(owner, "Tjedna kupnja", null);
        itemId = lists.addItem(owner, listId, "Mlijeko");
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    @Test
    void aStrangerGets404OnEveryByIdRoute() throws Exception {
        mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(stranger))).andExpect(status().isNotFound());
        mvc.perform(json(put("/api/shopping-lists/{id}", listId), "{\"title\":\"Moja\"}").with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{id}", listId).with(as(stranger))).andExpect(status().isNotFound());
        mvc.perform(json(post("/api/shopping-lists/{id}/copy", listId), "{\"title\":\"Kopija\"}").with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(json(post("/api/shopping-lists/{id}/items", listId), "{\"name\":\"Kruh\"}").with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(json(put("/api/shopping-lists/{id}/items/{itemId}", listId, itemId), "{\"name\":\"Mlijeko\",\"isChecked\":true}")
                        .with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId).with(as(stranger)))
                .andExpect(status().isNotFound());

        JsonNode list = body(mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(owner))).andExpect(status().isOk()));
        assertThat(list.get("title").asString()).isEqualTo("Tjedna kupnja");
        assertThat(list.get("items")).singleElement().satisfies(item -> assertThat(item.get("isChecked").asBoolean()).isFalse());
    }

    @Test
    void anAnonymousCallerGets404OnAPrivateList() throws Exception {
        mvc.perform(get("/api/shopping-lists/{id}", listId)).andExpect(status().isNotFound());
        mvc.perform(json(put("/api/shopping-lists/{id}", listId), "{\"title\":\"Moja\"}")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{id}", listId)).andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId)).andExpect(status().isNotFound());
    }

    @Test
    void anItemIsOnlyReachableThroughItsOwnList() throws Exception {
        String strangersList = lists.createList(stranger, "Moja lista", null);

        mvc.perform(json(put("/api/shopping-lists/{id}/items/{itemId}", strangersList, itemId), "{\"name\":\"Mlijeko\",\"isChecked\":true}")
                        .with(as(stranger)))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", strangersList, itemId).with(as(stranger)))
                .andExpect(status().isNotFound());
    }

    @Test
    void theListEndpointsReturnOnlyTheCallersRows() throws Exception {
        String strangersList = lists.createList(stranger, "Moja lista", null);
        lists.addItem(stranger, strangersList, "Kruh");

        JsonNode mine = body(mvc.perform(get("/api/shopping-lists/me").with(as(stranger))).andExpect(status().isOk()));
        assertThat(mine).singleElement().satisfies(list -> assertThat(list.get("id").asString()).isEqualTo(strangersList));

        JsonNode items = body(mvc.perform(get("/api/shopping-lists/items").with(as(stranger))).andExpect(status().isOk()));
        assertThat(items).singleElement().satisfies(item -> assertThat(item.get("name").asString()).isEqualTo("Kruh"));
    }

    @Test
    void theOwnerListRoutesNeedAToken() throws Exception {
        mvc.perform(get("/api/shopping-lists/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/shopping-lists/items")).andExpect(status().isUnauthorized());
        mvc.perform(json(post("/api/shopping-lists"), "{\"title\":\"Nova\"}")).andExpect(status().isUnauthorized());
    }
}
