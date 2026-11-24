package disscount.shoppinglist;

import disscount.shared.Timestamps;
import disscount.shoppinglist.item.ShoppingListItem;
import disscount.shoppinglist.item.ShoppingListItemDto;
import disscount.shoppinglist.item.ShoppingListItemRepository;
import disscount.shoppinglist.item.ShoppingListItemService;
import disscount.user.ActiveUsers;
import disscount.user.AuthIdentityDao;
import disscount.user.User;
import disscount.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.jdbc.JdbcTestUtils;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// Not transactional, so the copy reads the saved items back instead of the cached empty list.
@DataJpaTest(showSql = false)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Import({
        ActiveUsers.class, AuthIdentityDao.class,
        ShoppingListService.class,
        ShoppingListItemService.class,
        ShoppingListCopyService.class,
        ShoppingListAccessService.class,
        ShoppingListGuard.class,
        ShoppingListMapper.class,
        ShoppingListQuota.class,
})
class ShoppingListCopyServiceTest {

    @Autowired ShoppingListCopyService copyService;
    @Autowired ShoppingListRepository lists;
    @Autowired ShoppingListItemRepository items;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;

    User owner;
    ShoppingList source;

    @BeforeEach
    void setUp() {
        JdbcTestUtils.deleteFromTables(jdbc, "app.shopping_list_item", "app.shopping_list", "app.app_user");
        owner = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
        source = lists.save(ShoppingList.builder()
                .ownerId(owner.getId())
                .title("Tjedni")
                .createdAt(Timestamps.nowUtc())
                .updatedAt(Timestamps.nowUtc())
                .build());
    }

    @Test
    void aCopyWithoutProgressKeepsThePriceAndStoreTypedForAPlainItem() {
        saveTickedItem(null, "Staklenke");

        ShoppingListItemDto copied = copyWithoutProgress();

        assertThat(copied.isChecked()).isFalse();
        assertThat(copied.chainCode()).isEqualTo("lidl");
        assertThat(copied.storePrice()).isEqualByComparingTo("2.50");
    }

    @Test
    void aCopyWithoutProgressClearsACatalogueItemsCapturedPrices() {
        saveTickedItem("3850354017608", "Mlijeko");

        ShoppingListItemDto copied = copyWithoutProgress();

        assertThat(copied.isChecked()).isFalse();
        assertThat(copied.chainCode()).isNull();
        assertThat(copied.avgPrice()).isNull();
        assertThat(copied.storePrice()).isNull();
    }

    private void saveTickedItem(String ean, String name) {
        items.save(ShoppingListItem.builder()
                .shoppingList(source)
                .ean(ean)
                .name(name)
                .amount(1)
                .isChecked(true)
                .chainCode("lidl")
                .avgPrice(ean == null ? null : new BigDecimal("3.00"))
                .storePrice(new BigDecimal("2.50"))
                .updatedByUserId(owner.getId())
                .build());
    }

    private ShoppingListItemDto copyWithoutProgress() {
        ShoppingListCopyRequest request = new ShoppingListCopyRequest();
        request.setTitle("Kopija");
        request.setIncludeItems(true);
        request.setIncludeProgress(false);

        return copyService.copy(source.getId(), owner.getId(), request).items().getFirst();
    }
}
