package disscount.shoppingListItem.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.ForbiddenException;
import disscount.exceptions.NotFoundException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.service.ShoppingListAccessService;
import disscount.shoppingList.service.ShoppingListMapper;
import disscount.shoppingList.service.ShoppingListService;
import disscount.shoppingListItem.dao.ShoppingListItemRepository;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.shoppingListItem.dto.ShoppingListItemDto;
import disscount.shoppingListItem.dto.ShoppingListItemRequest;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Each method resolves the caller's access; findVisible answers not-found, so item endpoints cannot probe for list ids. */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListItemService {

    private final ShoppingListItemRepository shoppingListItemRepository;
    private final ShoppingListRepository shoppingListRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListService shoppingListService;
    private final ShoppingListMapper shoppingListMapper;

    /** Owner only: an unbounded right to add to someone else's list waits for per-person revocation, version 2's job. */
    public ShoppingListItemDto addItemToShoppingList(UUID shoppingListId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList shoppingList = shoppingListService.findVisible(shoppingListId, userId);
        User actor = shoppingListService.requireWriteUser(userId);

        if (!accessService.resolve(shoppingList, userId).isOwner()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyAddItems");
        }

        String ean = ShoppingListItemMatcher.blankToNull(request.getEan());
        String name = request.getName().strip();
        Optional<ShoppingListItem> existingItem = ShoppingListItemMatcher.findMergeTarget(
                shoppingListItemRepository.findActiveByShoppingList(shoppingList), ean, name);

        ShoppingListItem item;
        if (existingItem.isPresent()) {
            item = existingItem.get();
            int requestedAmount = request.getAmount() != null ? request.getAmount() : 1;
            // Cap the merged total at the same limit the request DTO enforces (@Max)
            int newAmount = Math.min(item.getAmount() + requestedAmount, 999);
            item.setAmount(newAmount);

            if (ean != null) {
                item.setEan(ean);
                item.setName(name);
            }
            if (request.getBrand() != null) item.setBrand(request.getBrand());
            if (request.getQuantity() != null) item.setQuantity(request.getQuantity());
            if (request.getUnit() != null) item.setUnit(request.getUnit());
            if (request.getChainCode() != null) item.setChainCode(request.getChainCode());
            if (request.getAvgPrice() != null) item.setAvgPrice(request.getAvgPrice());
            if (request.getStorePrice() != null) item.setStorePrice(request.getStorePrice());

            item.setUpdatedAt(Timestamps.nowUtc());
            item.setUpdatedByUser(actor);
        } else {
            item = ShoppingListItem.builder()
                    .shoppingList(shoppingList)
                    .ean(ean)
                    .brand(request.getBrand())
                    .name(name)
                    .quantity(request.getQuantity())
                    .unit(request.getUnit())
                    .amount(request.getAmount() != null ? request.getAmount() : 1)
                    .isChecked(request.getIsChecked() != null ? request.getIsChecked() : false)
                    .chainCode(request.getChainCode())
                    .avgPrice(request.getAvgPrice())
                    .storePrice(request.getStorePrice())
                    .updatedByUser(actor)
                    .build();
        }

        item = shoppingListItemRepository.save(item);
        touchList(shoppingList);

        return shoppingListMapper.toItemDto(item, ListAccess.OWNER);
    }

    /** SHOP is enough: ticking off and choosing a store is the in-the-shop level. */
    public ShoppingListItemDto updateShoppingListItem(
            UUID listId, UUID itemId, UUID userId, ShoppingListItemRequest request) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        User actor = shoppingListService.requireWriteUser(userId);
        ListAccess access = requireAccess(list, userId, ListAccess::canCheck);

        ShoppingListItem item = findItem(list, itemId);

        applyItemUpdate(item, request, access);
        item.setUpdatedAt(Timestamps.nowUtc());
        item.setUpdatedByUser(actor);

        item = shoppingListItemRepository.save(item);
        touchList(list);

        return shoppingListMapper.toItemDto(item, access);
    }

    public void deleteShoppingListItem(UUID listId, UUID itemId, UUID userId) {
        ShoppingList list = shoppingListService.findVisible(listId, userId);
        shoppingListService.requireWriteUser(userId);
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

    /** Structural fields stay as the server has them, so a SHOP caller cannot rename or resize by sending a fuller payload. */
    private void applyItemUpdate(ShoppingListItem item, ShoppingListItemRequest request, ListAccess access) {
        item.setIsChecked(request.getIsChecked() != null ? request.getIsChecked() : false);
        item.setChainCode(request.getChainCode());
        item.setAvgPrice(request.getAvgPrice());
        item.setStorePrice(request.getStorePrice());

        if (!access.canEditItems()) {
            return;
        }

        // A plain item has no EAN to send back, and a missing one must never unlink a product.
        String ean = ShoppingListItemMatcher.blankToNull(request.getEan());
        if (ean != null) item.setEan(ean);
        item.setBrand(request.getBrand());
        item.setName(request.getName().strip());
        item.setQuantity(request.getQuantity());
        item.setUnit(request.getUnit());
        item.setAmount(request.getAmount() != null ? request.getAmount() : 1);
    }

    /** Item activity reorders the owner's list index, which sorts by updatedAt. */
    private void touchList(ShoppingList list) {
        list.setUpdatedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }
}
