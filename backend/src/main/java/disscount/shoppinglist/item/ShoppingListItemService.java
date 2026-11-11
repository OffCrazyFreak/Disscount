package disscount.shoppinglist.item;

import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.ForbiddenException;
import disscount.shared.NotFoundException;
import disscount.shared.Timestamps;
import disscount.shoppinglist.ListAccess;
import disscount.shoppinglist.ShoppingList;
import disscount.shoppinglist.ShoppingListAccessService;
import disscount.shoppinglist.ShoppingListGuard;
import disscount.shoppinglist.ShoppingListMapper;
import disscount.shoppinglist.ShoppingListQuota;
import disscount.shoppinglist.ShoppingListRepository;
import disscount.shoppinglist.ShoppingListService;

import java.util.Optional;
import java.util.UUID;

/** Each method resolves access; findVisible answers not-found, so item endpoints cannot probe for list ids. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShoppingListItemService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListService shoppingListService;
    private final ShoppingListGuard guard;
    private final ShoppingListMapper shoppingListMapper;
    private final ShoppingListQuota quota;

    /** Owner only: an unbounded right to add to someone's list waits for per-person revocation in version 2. */
    @PreAuthorize("@shoppingListGuard.canWrite(#shoppingListId, #userId)")
    @Transactional
    public ShoppingListItemDto addItemToShoppingList(UUID shoppingListId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList shoppingList = shoppingListService.findVisible(shoppingListId, userId);
        guard.requireWriteUser(userId);

        if (!accessService.resolve(shoppingList, userId).isOwner()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyAddItems");
        }

        quota.lockOwner(shoppingList);

        String ean = ShoppingListItemMatcher.blankToNull(request.ean());
        String name = request.name().strip();
        Optional<ShoppingListItem> existingItem = ShoppingListItemMatcher.findMergeTarget(
                shoppingListItemRepository.findActiveByShoppingList(shoppingList), ean, name);

        ShoppingListItem item;
        if (existingItem.isPresent()) {
            item = existingItem.get();
            int requestedAmount = request.amount() != null ? request.amount() : 1;
            // Cap the merged total at the same limit the request DTO enforces (@Max)
            int newAmount = Math.min(item.getAmount() + requestedAmount, 999);
            item.setAmount(newAmount);

            if (ean != null) {
                item.setEan(ean);
                item.setName(name);
            }
            if (request.brand() != null) item.setBrand(request.brand());
            if (request.quantity() != null) item.setQuantity(request.quantity());
            if (request.unit() != null) item.setUnit(request.unit());
            if (request.chainCode() != null) item.setChainCode(request.chainCode());
            if (request.avgPrice() != null) item.setAvgPrice(request.avgPrice());
            if (request.storePrice() != null) item.setStorePrice(request.storePrice());

            item.setUpdatedAt(Timestamps.nowUtc());
            item.setUpdatedByUserId(userId);
        } else {
            // A merge adds no row, so only a new item counts against the cap.
            quota.requireRoomForItem(shoppingList);

            item = ShoppingListItem.builder()
                    .shoppingList(shoppingList)
                    .ean(ean)
                    .brand(request.brand())
                    .name(name)
                    .quantity(request.quantity())
                    .unit(request.unit())
                    .amount(request.amount() != null ? request.amount() : 1)
                    .isChecked(request.isChecked() != null ? request.isChecked() : false)
                    .chainCode(request.chainCode())
                    .avgPrice(request.avgPrice())
                    .storePrice(request.storePrice())
                    .updatedByUserId(userId)
                    .build();
        }

        item = shoppingListItemRepository.save(item);
        touchList(shoppingList);

        return shoppingListMapper.toItemDto(item, ListAccess.OWNER);
    }

    /** SHOP is enough: ticking off and choosing a store is the in-the-shop level. */
    @PreAuthorize("@shoppingListGuard.canCheckItems(#listId, #userId)")
    @Transactional
    public ShoppingListItemDto updateShoppingListItem(
            UUID listId, UUID itemId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        guard.requireWriteUser(userId);
        ListAccess access = requireAccess(list, userId, ListAccess::canCheck);

        ShoppingListItem item = findItem(list, itemId);

        applyItemUpdate(item, request, access);
        item.setUpdatedAt(Timestamps.nowUtc());
        item.setUpdatedByUserId(userId);

        item = shoppingListItemRepository.save(item);
        touchList(list);

        return shoppingListMapper.toItemDto(item, access);
    }

    @PreAuthorize("@shoppingListGuard.canEditItems(#listId, #userId)")
    @Transactional
    public void deleteShoppingListItem(UUID listId, UUID itemId, UUID userId) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        guard.requireWriteUser(userId);
        requireAccess(list, userId, ListAccess::canEditItems);

        ShoppingListItem item = findItem(list, itemId);

        item.setDeletedAt(Timestamps.nowUtc());
        shoppingListItemRepository.save(item);
        touchList(list);
    }

    private ShoppingListItem findItem(ShoppingList list, UUID itemId) {
        return shoppingListItemRepository.findActiveByIdAndShoppingList(itemId, list)
                .orElseThrow(() -> new NotFoundException("error.shoppingListItem.notFound"));
    }

    private ListAccess requireAccess(
            ShoppingList list, UUID userId, java.util.function.Predicate<ListAccess> allowed) {
        ListAccess access = accessService.resolve(list, userId);
        if (!allowed.test(access)) {
            throw new ForbiddenException("error.shoppingList.insufficientAccess");
        }
        return access;
    }

    /** Structural fields stay as stored, so a SHOP caller cannot rename or resize with a fuller payload. */
    private void applyItemUpdate(ShoppingListItem item, ShoppingListItemRequest request, ListAccess access) {
        item.setIsChecked(request.isChecked() != null ? request.isChecked() : false);
        item.setChainCode(request.chainCode());
        item.setAvgPrice(request.avgPrice());
        item.setStorePrice(request.storePrice());

        if (!access.canEditItems()) {
            return;
        }

        // A plain item has no EAN to send back, and a missing one must never unlink a product.
        String ean = ShoppingListItemMatcher.blankToNull(request.ean());
        if (ean != null) item.setEan(ean);
        item.setBrand(request.brand());
        item.setName(request.name().strip());
        item.setQuantity(request.quantity());
        item.setUnit(request.unit());
        item.setAmount(request.amount() != null ? request.amount() : 1);
    }

    /** Item activity reorders the owner's list index, which sorts by updatedAt. */
    private void touchList(ShoppingList list) {
        list.setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }
}
