package disscount.shoppinglist;

import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** @SQLRestriction hides deleted lists and items, so an item can point at a list that JPA no longer sees. */
class ShoppingListSoftDeleteTest extends FullStackTest {

    private ShoppingListFixtures fixtures;
    private User owner;

    @BeforeEach
    void setUp() {
        fixtures = new ShoppingListFixtures(mvc, json);
        owner = newUser("owner");
    }

    // The owner's lists load with a left join fetch of the items, which must keep a list whose items are all gone.
    @Test
    void aListWhoseItemsAreAllDeletedStillShowsWithNoItems() throws Exception {
        String listId = fixtures.createList(owner, "Tjedna kupnja", null);
        String itemId = fixtures.addItem(owner, listId, "Mlijeko");

        mvc.perform(delete("/api/shopping-lists/{listId}/items/{itemId}", listId, itemId).with(as(owner)))
                .andExpect(status().is2xxSuccessful());

        mvc.perform(get("/api/shopping-lists/me").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == '%s')].items.length()", listId).value(0));
        mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
        mvc.perform(get("/api/shopping-lists/items").with(as(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // The items of a deleted list stay live rows, so every way to reach one must answer as if it were gone.
    @Test
    void theItemsOfADeletedListAreUnreachable() throws Exception {
        String listId = fixtures.createList(owner, "Stari popis", null);
        String itemId = fixtures.addItem(owner, listId, "Kruh");

        mvc.perform(delete("/api/shopping-lists/{id}", listId).with(as(owner))).andExpect(status().is2xxSuccessful());

        mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(owner))).andExpect(status().isNotFound());
        mvc.perform(put("/api/shopping-lists/{listId}/items/{itemId}", listId, itemId).with(as(owner))
                        .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Kruh\"}"))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/shopping-lists/{listId}/items/{itemId}", listId, itemId).with(as(owner)))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/shopping-lists/me").with(as(owner)))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(get("/api/shopping-lists/items").with(as(owner)))
                .andExpect(jsonPath("$.length()").value(0));
    }
}
