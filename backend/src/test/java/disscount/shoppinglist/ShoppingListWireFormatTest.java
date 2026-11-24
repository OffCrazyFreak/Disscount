package disscount.shoppinglist;

import java.util.Set;
import disscount.support.ApiContract;
import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import tools.jackson.databind.JsonNode;

import static disscount.support.WireFormat.LOCAL_DATE_TIME;
import static disscount.support.WireFormat.UUID;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Pins ShoppingListDto and ShoppingListItemDto against shoppingListDtoSchema and shoppingListItemDtoSchema. */
class ShoppingListWireFormatTest extends FullStackTest {


    @Test
    void theOwnersListCarriesEveryFieldWithItemsInline() throws Exception {
        User owner = newUser("owner");
        String listId = new ShoppingListFixtures(mvc, json).createList(owner, "Tjedna kupnja", null);
        mvc.perform(post("/api/shopping-lists/{id}/items", listId).with(as(owner)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Mlijeko\",\"ean\":\"3850123456789\",\"brand\":\"Dukat\",\"quantity\":\"1\",\"unit\":\"l\","
                        + "\"amount\":2,\"chainCode\":\"konzum\",\"avgPrice\":1.99,\"storePrice\":1.5}"))
                .andExpect(status().isOk());

        JsonNode list = body(mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(owner))).andExpect(status().isOk()));

        ApiContract.assertMatches("ShoppingListDto", list);
        assertThat(list.get("ownerId").asString()).isEqualTo(owner.getId().toString());
        assertThat(list.get("linkAccess").asString()).isEqualTo("NONE");
        assertThat(list.get("myAccess").asString()).isEqualTo("OWNER");
        assertThat(list.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(list.get("updatedAt").asString()).matches(LOCAL_DATE_TIME);

        JsonNode item = list.get("items").get(0);
        ApiContract.assertMatches("ShoppingListItemDto", item);
        assertThat(item.get("shoppingListId").asString()).isEqualTo(listId);
        assertThat(item.get("amount").isIntegralNumber()).isTrue();
        assertThat(item.get("isChecked").isBoolean()).isTrue();
        assertThat(item.get("avgPrice").isNumber()).isTrue();
        assertThat(item.get("avgPrice").decimalValue()).isEqualByComparingTo("1.99");
        assertThat(item.get("storePrice").decimalValue()).isEqualByComparingTo("1.5");
        assertThat(item.get("createdAt").asString()).matches(LOCAL_DATE_TIME);
        assertThat(item.get("updatedByUserId").asString()).matches(UUID);
    }

    @Test
    void aPlainItemSendsItsEmptyFieldsAsNull() throws Exception {
        User owner = newUser("owner");
        String listId = new ShoppingListFixtures(mvc, json).createList(owner, "Kupnja", null);

        JsonNode item = body(mvc.perform(post("/api/shopping-lists/{id}/items", listId).with(as(owner))
                .contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Kruh\"}")).andExpect(status().isOk()));

        ApiContract.assertMatches("ShoppingListItemDto", item);
        for (String field : Set.of("ean", "brand", "quantity", "unit", "chainCode", "avgPrice", "storePrice")) {
            assertThat(item.get(field).isNull()).as(field).isTrue();
        }
        assertThat(item.get("amount").asInt()).isEqualTo(1);
        assertThat(item.get("isChecked").asBoolean()).isFalse();
    }

    @Test
    void theFlatItemListUsesTheSameItemShape() throws Exception {
        User owner = newUser("owner");
        ShoppingListFixtures lists = new ShoppingListFixtures(mvc, json);
        lists.addItem(owner, lists.createList(owner, "Kupnja", null), "Jaja");

        JsonNode items = body(mvc.perform(get("/api/shopping-lists/items").with(as(owner))).andExpect(status().isOk()));

        assertThat(items).singleElement()
                .satisfies(item -> ApiContract.assertMatches("ShoppingListItemDto", item));
    }
}
