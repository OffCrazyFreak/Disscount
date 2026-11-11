package disscount.shoppinglist;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.ForbiddenException;
import disscount.shared.NotFoundException;
import disscount.shared.Timestamps;
import disscount.shared.UnauthorizedException;
import disscount.user.ActiveUsers;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** By-id methods run with an optional bearer token, so userId may be null; authorization is here (docs/SHARING.md). */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final ActiveUsers activeUsers;
    private final ShoppingListAccessService accessService;
    private final ShoppingListMapper shoppingListMapper;

    public ShoppingListDto createShoppingList(UUID ownerId, ShoppingListRequest request) {
        activeUsers.requireActive(ownerId);

        ShoppingList shoppingList = ShoppingList.builder()
                .ownerId(ownerId)
                .title(request.title())
                .build();

        applyLinkAccess(shoppingList, request.linkAccess());

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    // Read-only, or the class-level @Transactional would keep a dirty-checking flush for a query that never writes.
    @Transactional(readOnly = true)
    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        activeUsers.requireActive(ownerId);

        return shoppingListRepository.findActiveByOwnerId(ownerId)
                .stream()
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    /** The owner's live items across all live lists, in list order, as the owner sees them. */
    @Transactional(readOnly = true)
    public List<ShoppingListItemDto> getUserShoppingListItems(UUID ownerId) {
        return getUserShoppingLists(ownerId).stream()
                .flatMap(list -> list.items().stream())
                .toList();
    }

    @Transactional(readOnly = true)
    public ShoppingListDto getShoppingListById(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);
        return shoppingListMapper.toDto(list, accessService.resolve(list, userId));
    }

    /** Renaming and resharing are separate rights; folding them lets EDIT reshare. */
    public ShoppingListDto updateShoppingList(UUID listId, UUID userId, ShoppingListRequest request) {
        ShoppingList list = findVisible(listId, userId);
        ListAccess access = accessService.resolve(list, userId);

        if (request.linkAccess() != null && !access.canManageShare()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyAccess");
        }

        requireWriteUser(userId);
        if (!access.canEditItems()) {
            throw new ForbiddenException("error.shoppingList.insufficientAccess");
        }

        list.setTitle(request.title());
        applyLinkAccess(list, request.linkAccess());

        return shoppingListMapper.toDto(shoppingListRepository.save(list), access);
    }

    public void deleteShoppingList(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);

        if (!accessService.resolve(list, userId).isOwner()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyDelete");
        }

        list.setDeletedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }

    /** Not-found rather than forbidden, so a 403 cannot confirm an id is real. */
    public ShoppingList findVisible(UUID listId, UUID userId) {
        ShoppingList list = shoppingListRepository.findActiveById(listId)
                .orElseThrow(() -> new NotFoundException("error.shoppingList.notFound"));

        if (!accessService.resolve(list, userId).canView()) {
            throw new NotFoundException("error.shoppingList.notFound");
        }

        return list;
    }

    /** Anonymous callers cap at VIEW, so every write stays attributable. */
    public void requireWriteUser(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("error.shoppingList.signInToChange");
        }
        activeUsers.requireActive(userId);
    }

    /** Off then on hands back the same URL, since the URL is the id. Intended. */
    private void applyLinkAccess(ShoppingList list, LinkAccess requested) {
        if (requested == null) {
            return;
        }

        ListAccess next = requested.toListAccess();
        list.setLinkAccess(next == ListAccess.NONE ? null : next);
    }
}
