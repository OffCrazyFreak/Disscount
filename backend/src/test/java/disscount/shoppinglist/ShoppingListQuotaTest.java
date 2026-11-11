package disscount.shoppinglist;

import disscount.shared.LimitReachedException;
import disscount.shared.Timestamps;
import disscount.shared.UserLimit;
import disscount.shoppinglist.item.ShoppingListItem;
import disscount.shoppinglist.item.ShoppingListItemDto;
import disscount.shoppinglist.item.ShoppingListItemRepository;
import disscount.shoppinglist.item.ShoppingListItemRequest;
import disscount.shoppinglist.item.ShoppingListItemService;
import disscount.support.Concurrently;
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

import java.util.List;
import java.util.UUID;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Not transactional on purpose: the race needs each create to commit on its own connection.
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
class ShoppingListQuotaTest {

    private static final int LIST_LIMIT = UserLimit.SHOPPING_LISTS.max();
    private static final int ITEM_LIMIT = UserLimit.SHOPPING_LIST_ITEMS.max();

    @Autowired ShoppingListService listService;
    @Autowired ShoppingListItemService itemService;
    @Autowired ShoppingListCopyService copyService;
    @Autowired ShoppingListRepository lists;
    @Autowired ShoppingListItemRepository items;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;

    User owner;

    @BeforeEach
    void setUp() {
        // Row by row would skip soft-deleted rows, which @SQLRestriction hides from JPA.
        JdbcTestUtils.deleteFromTables(jdbc, "app.shopping_list_item", "app.shopping_list", "app.app_user");
        owner = users.save(User.builder().id(UUID.randomUUID()).username("ana").build());
    }

    @Test
    void theFiftiethListPassesAndTheNextIsRefused() {
        saveLists(LIST_LIMIT - 1);
        createList("Zadnji");

        assertRefused(() -> createList("Višak"), UserLimit.SHOPPING_LISTS);
        assertThat(lists.countActiveByOwnerId(owner.getId())).isEqualTo(LIST_LIMIT);
    }

    @Test
    void aDeletedListFreesItsPlace() {
        saveLists(LIST_LIMIT);
        listService.deleteShoppingList(lists.findActiveByOwnerId(owner.getId()).get(0).getId(), owner.getId());

        assertThat(createList("Novi").title()).isEqualTo("Novi");
    }

    @Test
    void aCopyCountsAsANewList() {
        saveLists(LIST_LIMIT);
        UUID source = lists.findActiveByOwnerId(owner.getId()).get(0).getId();

        assertRefused(() -> copy(source, false), UserLimit.SHOPPING_LISTS);
    }

    @Test
    void aCopyCarriesItsItemsUnderTheItemCap() {
        ShoppingList source = saveLists(1).get(0);
        saveItems(source, ITEM_LIMIT);

        assertThat(copy(source.getId(), true).items()).hasSize(ITEM_LIMIT);
    }

    @Test
    void theFiftiethItemPassesAndTheNextIsRefused() {
        ShoppingList list = saveLists(1).get(0);
        saveItems(list, ITEM_LIMIT - 1);
        addItem(list, "Zadnji");

        assertRefused(() -> addItem(list, "Višak"), UserLimit.SHOPPING_LIST_ITEMS);
        assertThat(items.countActiveByShoppingList(list)).isEqualTo(ITEM_LIMIT);
    }

    @Test
    void anItemThatMergesStillPassesAtTheCap() {
        ShoppingList list = saveLists(1).get(0);
        saveItems(list, ITEM_LIMIT);

        assertThat(addItem(list, "Proizvod 0").amount()).isEqualTo(2);
    }

    @Test
    void aDeletedItemFreesItsPlace() {
        ShoppingList list = saveLists(1).get(0);
        saveItems(list, ITEM_LIMIT);
        itemService.deleteShoppingListItem(list.getId(), items.findActiveByShoppingList(list).get(0).getId(), owner.getId());

        assertThat(addItem(list, "Novi").name()).isEqualTo("Novi");
    }

    @Test
    void itemsOnOneListDoNotCountAgainstAnother() {
        List<ShoppingList> twoLists = saveLists(2);
        saveItems(twoLists.get(0), ITEM_LIMIT);

        assertThat(addItem(twoLists.get(1), "Novi").name()).isEqualTo("Novi");
    }

    @Test
    void concurrentListCreatesCannotPassTheCap() throws Exception {
        saveLists(LIST_LIMIT - 1);

        List<Throwable> failures = Concurrently.run(6, i -> createList("Novi " + i));

        assertThat(failures).hasSize(5).allMatch(LimitReachedException.class::isInstance);
        assertThat(lists.countActiveByOwnerId(owner.getId())).isEqualTo(LIST_LIMIT);
    }

    @Test
    void concurrentItemAddsCannotPassTheCap() throws Exception {
        ShoppingList list = saveLists(1).get(0);
        saveItems(list, ITEM_LIMIT - 1);

        List<Throwable> failures = Concurrently.run(6, i -> addItem(list, "Novi " + i));

        assertThat(failures).hasSize(5).allMatch(LimitReachedException.class::isInstance);
        assertThat(items.countActiveByShoppingList(list)).isEqualTo(ITEM_LIMIT);
    }

    @Test
    void concurrentAddsOfOneNewProductMergeAtTheCap() throws Exception {
        ShoppingList list = saveLists(1).get(0);
        saveItems(list, ITEM_LIMIT - 1);

        List<Throwable> failures = Concurrently.run(6, i -> addItem(list, "Isti"));

        assertThat(failures).isEmpty();
        assertThat(items.countActiveByShoppingList(list)).isEqualTo(ITEM_LIMIT);
    }

    private ShoppingListDto createList(String title) {
        return listService.createShoppingList(owner.getId(), new ShoppingListRequest(title, null));
    }

    private ShoppingListDto copy(UUID sourceId, boolean includeItems) {
        ShoppingListCopyRequest request = new ShoppingListCopyRequest();
        request.setTitle("Kopija");
        request.setIncludeItems(includeItems);
        return copyService.copy(sourceId, owner.getId(), request);
    }

    private ShoppingListItemDto addItem(ShoppingList list, String name) {
        return itemService.addItemToShoppingList(list.getId(), owner.getId(),
                new ShoppingListItemRequest(null, null, name, null, null, 1, null, null, null, null));
    }

    private List<ShoppingList> saveLists(int count) {
        return lists.saveAll(IntStream.range(0, count).mapToObj(i -> ShoppingList.builder()
                .ownerId(owner.getId())
                .title("Popis " + i)
                .createdAt(Timestamps.nowUtc())
                .updatedAt(Timestamps.nowUtc())
                .build()).toList());
    }

    private void saveItems(ShoppingList list, int count) {
        items.saveAll(IntStream.range(0, count).mapToObj(i -> ShoppingListItem.builder()
                .shoppingList(list)
                .name("Proizvod " + i)
                .amount(1)
                .isChecked(false)
                .updatedByUserId(owner.getId())
                .build()).toList());
    }

    private static void assertRefused(Runnable call, UserLimit limit) {
        assertThatThrownBy(call::run)
                .isInstanceOfSatisfying(LimitReachedException.class, e -> assertThat(e.getLimit()).isEqualTo(limit));
    }
}
