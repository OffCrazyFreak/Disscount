package disscount.shoppinglist.item;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import disscount.shared.Timestamps;
import disscount.shoppinglist.ShoppingList;
import disscount.shoppinglist.ShoppingListAccessService;
import disscount.shoppinglist.ShoppingListGuard;
import disscount.shoppinglist.ShoppingListMapper;
import disscount.shoppinglist.ShoppingListQuota;
import disscount.shoppinglist.ShoppingListRepository;
import disscount.shoppinglist.ShoppingListService;
import disscount.user.ActiveUsers;
import disscount.user.AuthIdentityDao;
import disscount.user.User;
import disscount.user.UserRepository;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(showSql = false)
@Import({
        ActiveUsers.class, AuthIdentityDao.class,
        ShoppingListItemService.class,
        ShoppingListService.class,
        ShoppingListAccessService.class,
        ShoppingListGuard.class,
        ShoppingListMapper.class,
        ShoppingListQuota.class,
})
class ShoppingListItemServiceAddTest {

    @Autowired ShoppingListItemService service;
    @Autowired ShoppingListItemRepository items;
    @Autowired ShoppingListRepository lists;
    @Autowired UserRepository users;

    User owner;
    ShoppingList list;

    @BeforeEach
    void setUp() {
        owner = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
        list = lists.save(ShoppingList.builder()
                .ownerId(owner.getId())
                .title("Vikend")
                .createdAt(Timestamps.nowUtc())
                .updatedAt(Timestamps.nowUtc())
                .build());
    }

    @Test
    void aPlainItemIsSavedWithoutAnEan() {
        ShoppingListItemDto added = add(null, "Staklenke", 2);

        assertThat(added.ean()).isNull();
        assertThat(added.amount()).isEqualTo(2);
    }

    @Test
    void aBlankEanIsStoredAsNull() {
        add("  ", "Staklenke", 1);

        assertThat(activeItems()).extracting(ShoppingListItem::getEan).containsExactly((String) null);
    }

    @Test
    void plainItemsMergeIgnoringCaseAndOuterSpaces() {
        add(null, "Čaše za vino", 1);
        add(null, "  čaše ZA vino ", 2);

        assertThat(activeItems()).singleElement().satisfies(item -> {
            assertThat(item.getName()).isEqualTo("Čaše za vino");
            assertThat(item.getAmount()).isEqualTo(3);
        });
    }

    @Test
    void twoProductsWithTheSameNameStayTwoRows() {
        add("3850000000001", "Mlijeko 1L", 1);
        add("3850000000002", "Mlijeko 1L", 1);

        assertThat(activeItems()).extracting(ShoppingListItem::getEan)
                .containsExactlyInAnyOrder("3850000000001", "3850000000002");
    }

    @Test
    void theSameProductAddedTwiceBumpsTheAmount() {
        add("3850000000001", "Mlijeko 1L", 1);
        add("3850000000001", "Mlijeko 1L", 4);

        assertThat(activeItems()).singleElement()
                .extracting(ShoppingListItem::getAmount).isEqualTo(5);
    }

    @Test
    void aProductTakesOverAPlainRowWithTheSameName() {
        add(null, "mlijeko", 2);
        add("3850000000001", "Mlijeko", 1);

        assertThat(activeItems()).singleElement().satisfies(item -> {
            assertThat(item.getEan()).isEqualTo("3850000000001");
            assertThat(item.getName()).isEqualTo("Mlijeko");
            assertThat(item.getAmount()).isEqualTo(3);
        });
    }

    @Test
    void aPlainItemMergesIntoAProductWithTheSameName() {
        add("3850000000001", "Mlijeko", 1);
        add(null, "mlijeko", 1);

        assertThat(activeItems()).singleElement().satisfies(item -> {
            assertThat(item.getEan()).isEqualTo("3850000000001");
            assertThat(item.getAmount()).isEqualTo(2);
        });
    }

    @Test
    void aCodePaddedWithZerosIsTheSameProduct() {
        add("0012345678905", "Mlijeko 1L", 1);
        add("12345678905", "Mlijeko 1L", 2);

        assertThat(activeItems()).singleElement().satisfies(item -> {
            assertThat(item.getEan()).isEqualTo("12345678905");
            assertThat(item.getAmount()).isEqualTo(3);
        });
    }

    @Test
    void anUpdateWithoutAnEanKeepsTheLinkedProduct() {
        ShoppingListItemDto added = add("3850000000001", "Mlijeko", 1);

        ShoppingListItemRequest update = request(null, "Mlijeko", 3);
        service.updateShoppingListItem(list.getId(), added.id(), owner.getId(), update);

        assertThat(activeItems()).singleElement().satisfies(item -> {
            assertThat(item.getEan()).isEqualTo("3850000000001");
            assertThat(item.getAmount()).isEqualTo(3);
        });
    }

    private ShoppingListItemDto add(String ean, String name, int amount) {
        return service.addItemToShoppingList(list.getId(), owner.getId(), request(ean, name, amount));
    }

    private List<ShoppingListItem> activeItems() {
        return items.findActiveByShoppingList(list);
    }

    private static ShoppingListItemRequest request(String ean, String name, int amount) {
        return new ShoppingListItemRequest(ean, null, name, null, null, amount, null, null, null, null);
    }
}
