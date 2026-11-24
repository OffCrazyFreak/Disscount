package disscount.shoppinglist;

import disscount.support.FullStackTest;
import disscount.user.User;
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

/** Invisible is 404, an anonymous write is 401 and too low a level is 403; anonymous visitors are capped at VIEW. */
class ShoppingListLinkAccessTest extends FullStackTest {

    private ShoppingListFixtures lists;
    private User owner;
    private User visitor;
    private String listId;
    private String itemId;

    @BeforeEach
    void setUp() throws Exception {
        lists = new ShoppingListFixtures(mvc, json);
        owner = newUser("owner");
        visitor = newUser("visitor");
        listId = lists.createList(owner, "Zajednička", null);
        itemId = lists.addItem(owner, listId, "Mlijeko");
    }

    private static MockHttpServletRequestBuilder withJson(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private MockHttpServletRequestBuilder checkItem() {
        return withJson(put("/api/shopping-lists/{id}/items/{itemId}", listId, itemId),
                "{\"name\":\"Preimenovano\",\"amount\":5,\"isChecked\":true}");
    }

    private MockHttpServletRequestBuilder rename(String body) {
        return withJson(put("/api/shopping-lists/{id}", listId), body);
    }

    @Test
    void aViewLinkShowsTheListWithoutAccountIdsAndRefusesWrites() throws Exception {
        lists.share(owner, listId, "Zajednička", "VIEW");

        JsonNode seen = body(mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(visitor))).andExpect(status().isOk()));
        assertThat(seen.get("myAccess").asString()).isEqualTo("VIEW");
        assertThat(seen.get("ownerId").isNull()).isTrue();
        assertThat(seen.get("linkAccess").isNull()).isTrue();
        assertThat(seen.get("items").get(0).get("updatedByUserId").isNull()).isTrue();

        mvc.perform(checkItem().with(as(visitor))).andExpect(status().isForbidden());
        mvc.perform(rename("{\"title\":\"Moja\"}").with(as(visitor))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId).with(as(visitor)))
                .andExpect(status().isForbidden());
    }

    @Test
    void anAnonymousVisitorIsCappedAtViewAndEveryWriteIs401() throws Exception {
        lists.share(owner, listId, "Zajednička", "EDIT");

        JsonNode seen = body(mvc.perform(get("/api/shopping-lists/{id}", listId)).andExpect(status().isOk()));
        assertThat(seen.get("myAccess").asString()).isEqualTo("VIEW");

        mvc.perform(checkItem()).andExpect(status().isUnauthorized());
        mvc.perform(rename("{\"title\":\"Moja\"}")).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId)).andExpect(status().isUnauthorized());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/items", listId), "{\"name\":\"Kruh\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/copy", listId), "{\"title\":\"Kopija\"}"))
                .andExpect(status().isUnauthorized());
    }

    // Owner-only writes say "sign in" to an anonymous visitor too, before telling them the list is not theirs.
    @Test
    void anAnonymousResharingOrDeleteIs401AndLeavesTheListAlone() throws Exception {
        lists.share(owner, listId, "Zajednička", "EDIT");

        mvc.perform(rename("{\"title\":\"Moja\",\"linkAccess\":\"VIEW\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/shopping-lists/{id}", listId)).andExpect(status().isUnauthorized());

        JsonNode list = body(mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(owner))).andExpect(status().isOk()));
        assertThat(list.get("title").asString()).isEqualTo("Zajednička");
        assertThat(list.get("linkAccess").asString()).isEqualTo("EDIT");
    }

    @Test
    void aShopLinkTicksItemsOffButChangesNothingStructural() throws Exception {
        lists.share(owner, listId, "Zajednička", "SHOP");

        JsonNode item = body(mvc.perform(checkItem().with(as(visitor))).andExpect(status().isOk()));
        assertThat(item.get("isChecked").asBoolean()).isTrue();
        assertThat(item.get("name").asString()).isEqualTo("Mlijeko");
        assertThat(item.get("amount").asInt()).isEqualTo(1);
        assertThat(item.get("updatedByUserId").isNull()).isTrue();

        mvc.perform(rename("{\"title\":\"Moja\"}").with(as(visitor))).andExpect(status().isForbidden());
        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId).with(as(visitor)))
                .andExpect(status().isForbidden());
    }

    @Test
    void anEditLinkEditsItemsAndTitleButNeverOwnerRights() throws Exception {
        lists.share(owner, listId, "Zajednička", "EDIT");

        mvc.perform(rename("{\"title\":\"Preimenovana\"}").with(as(visitor))).andExpect(status().isOk());
        mvc.perform(rename("{\"title\":\"Preimenovana\",\"linkAccess\":\"VIEW\"}").with(as(visitor)))
                .andExpect(status().isForbidden());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/items", listId), "{\"name\":\"Kruh\"}").with(as(visitor)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/shopping-lists/{id}", listId).with(as(visitor))).andExpect(status().isForbidden());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/copy", listId), "{\"title\":\"Kopija\",\"includeSharing\":true}")
                        .with(as(visitor)))
                .andExpect(status().isForbidden());

        JsonNode copy = body(mvc.perform(withJson(post("/api/shopping-lists/{id}/copy", listId),
                "{\"title\":\"Kopija\",\"includeItems\":true}").with(as(visitor))).andExpect(status().isOk()));
        assertThat(copy.get("myAccess").asString()).isEqualTo("OWNER");
        assertThat(copy.get("ownerId").asString()).isEqualTo(visitor.getId().toString());

        mvc.perform(delete("/api/shopping-lists/{id}/items/{itemId}", listId, itemId).with(as(visitor)))
                .andExpect(status().isNoContent());
    }

    // Adding items and deleting the list are owner rights at every level; any signed-in visitor can copy.
    @org.junit.jupiter.params.ParameterizedTest
    @org.junit.jupiter.params.provider.ValueSource(strings = {"VIEW", "SHOP"})
    void lowerLinksNeverGrantOwnerRightsButMayCopy(String level) throws Exception {
        lists.share(owner, listId, "Zajednička", level);

        mvc.perform(withJson(post("/api/shopping-lists/{id}/items", listId), "{\"name\":\"Kruh\"}").with(as(visitor)))
                .andExpect(status().isForbidden());
        mvc.perform(delete("/api/shopping-lists/{id}", listId).with(as(visitor))).andExpect(status().isForbidden());
        mvc.perform(rename("{\"title\":\"Zajednička\",\"linkAccess\":\"EDIT\"}").with(as(visitor)))
                .andExpect(status().isForbidden());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/copy", listId), "{\"title\":\"Kopija\",\"includeSharing\":true}")
                        .with(as(visitor)))
                .andExpect(status().isForbidden());

        JsonNode copy = body(mvc.perform(withJson(post("/api/shopping-lists/{id}/copy", listId), "{\"title\":\"Kopija\"}")
                .with(as(visitor))).andExpect(status().isOk()));
        assertThat(copy.get("ownerId").asString()).isEqualTo(visitor.getId().toString());
    }

    @Test
    void turningTheLinkOffHidesTheListAgain() throws Exception {
        lists.share(owner, listId, "Zajednička", "EDIT");
        lists.share(owner, listId, "Zajednička", "NONE");

        mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(visitor))).andExpect(status().isNotFound());
        mvc.perform(get("/api/shopping-lists/{id}", listId)).andExpect(status().isNotFound());
    }

    @Test
    void aSharedListNeverAppearsInTheVisitorsOwnLists() throws Exception {
        lists.share(owner, listId, "Zajednička", "EDIT");

        JsonNode mine = body(mvc.perform(get("/api/shopping-lists/me").with(as(visitor))).andExpect(status().isOk()));
        assertThat(mine).isEmpty();
    }
}
