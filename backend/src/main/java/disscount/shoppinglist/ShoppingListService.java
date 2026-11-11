package disscount.shoppinglist;

import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.errors.ForbiddenException;
import disscount.shared.errors.NotFoundException;
import disscount.shared.Timestamps;
import disscount.shoppinglist.item.ShoppingListItemDto;
import disscount.user.AccountErased;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** By-id methods run with an optional bearer token, so userId may be null; authorization is here (docs/SHARING.md). */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ActiveUsers activeUsers;
    private final ShoppingListAccessService accessService;
    private final ShoppingListGuard guard;
    private final ShoppingListMapper shoppingListMapper;
    private final ShoppingListQuota quota;

    @Transactional
    public ShoppingListDto createShoppingList(UUID ownerId, ShoppingListRequest request) {
        quota.requireRoomForList(ownerId, 0);

        ShoppingList shoppingList = ShoppingList.builder()
                .ownerId(ownerId)
                .title(request.title())
                .build();

        applyLinkAccess(shoppingList, request.linkAccess());

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        activeUsers.requireActive(ownerId);

        return shoppingListRepository.findActiveByOwnerId(ownerId)
                .stream()
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    /** The owner's live items across all live lists, in list order, as the owner sees them. */
    public List<ShoppingListItemDto> getUserShoppingListItems(UUID ownerId) {
        return getUserShoppingLists(ownerId).stream()
                .flatMap(list -> list.items().stream())
                .toList();
    }

    @PreAuthorize("@shoppingListGuard.canView(#listId, #userId)")
    public ShoppingListDto getShoppingListById(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);
        return shoppingListMapper.toDto(list, accessService.resolve(list, userId));
    }

    /** Renaming and resharing are separate rights; folding them lets EDIT reshare. */
    @PreAuthorize("@shoppingListGuard.canWrite(#listId, #userId)")
    @Transactional
    public ShoppingListDto updateShoppingList(UUID listId, UUID userId, ShoppingListRequest request) {
        // Locked before the list loads, so the access below reads what a racing share change or erasure left.
        lockOwner(listId, userId);
        ShoppingList list = findVisible(listId, userId);
        ListAccess access = accessService.resolve(list, userId);

        if (request.linkAccess() != null && !access.canManageShare()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyAccess");
        }

        guard.requireWriteUser(userId);
        if (!access.canEditItems()) {
            throw new ForbiddenException("error.shoppingList.insufficientAccess");
        }

        list.setTitle(request.title());
        applyLinkAccess(list, request.linkAccess());

        return shoppingListMapper.toDto(shoppingListRepository.save(list), access);
    }

    @PreAuthorize("@shoppingListGuard.canWrite(#listId, #userId)")
    @Transactional
    public void deleteShoppingList(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);

        if (!accessService.resolve(list, userId).isOwner()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyDelete");
        }

        list.setDeletedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }

    /** Not-found rather than forbidden, so a 403 cannot confirm an id is real. */
    @PreAuthorize("@shoppingListGuard.canView(#listId, #userId)")
    public ShoppingList findVisible(UUID listId, UUID userId) {
        ShoppingList list = shoppingListRepository.findById(listId)
                .orElseThrow(() -> new NotFoundException("error.shoppingList.notFound"));

        if (!accessService.resolve(list, userId).canView()) {
            throw new NotFoundException("error.shoppingList.notFound");
        }

        return list;
    }

    /** A link nobody can switch off must not outlive its owner, so it goes off; the lists stay (owner, 2026-11-11). */
    @EventListener
    @Order(50)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        shoppingListRepository.unshareAllOfOwner(erased.userId());
    }

    /**
     * An update racing the owner's erasure lands before it or is refused: the owner with the 401 of every write
     * after deletion, a link visitor with the 404 of an unknown link.
     */
    private void lockOwner(UUID listId, UUID callerId) {
        UUID ownerId = shoppingListRepository.findSharingById(listId)
                .map(ListSharing::ownerId)
                .orElseThrow(() -> new NotFoundException("error.shoppingList.notFound"));

        if (ownerId.equals(callerId)) {
            activeUsers.lockActive(callerId);
            return;
        }

        if (!activeUsers.lockIfActive(ownerId)) {
            throw new NotFoundException("error.shoppingList.notFound");
        }
    }

    /** Off then on hands back the same URL, since the URL is the id. Intended. Callers hold the owner's row lock. */
    private void applyLinkAccess(ShoppingList list, LinkAccess requested) {
        if (requested == null) {
            return;
        }

        ListAccess next = requested.toListAccess();
        list.setLinkAccess(next == ListAccess.NONE ? null : next);
    }
}
