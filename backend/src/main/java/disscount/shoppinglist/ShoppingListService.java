package disscount.shoppinglist;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.ForbiddenException;
import disscount.shared.NotFoundException;
import disscount.shared.Timestamps;
import disscount.shared.UnauthorizedException;
import disscount.user.User;
import disscount.user.UserRepository;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/** By-id methods run with an optional bearer token, so userId may be null; authorization is here (docs/SHARING.md). */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;
    private final ShoppingListAccessService accessService;
    private final ShoppingListMapper shoppingListMapper;

    public ShoppingListDto createShoppingList(UUID ownerId, ShoppingListRequest request) {
        User owner = requireUser(ownerId);

        ShoppingList shoppingList = ShoppingList.builder()
                .owner(owner)
                .title(request.getTitle())
                .build();

        applyLinkAccess(shoppingList, request.getLinkAccess());

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    // Read-only, or the class-level @Transactional would keep a dirty-checking flush for a query that never writes.
    @Transactional(readOnly = true)
    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        User owner = requireUser(ownerId);

        return shoppingListRepository.findActiveByOwner(owner)
                .stream()
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER))
                .collect(Collectors.toList());
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

        if (request.getLinkAccess() != null && !access.canManageShare()) {
            throw new ForbiddenException("error.shoppingList.ownerOnlyAccess");
        }

        requireWriteUser(userId);
        if (!access.canEditItems()) {
            throw new ForbiddenException("error.shoppingList.insufficientAccess");
        }

        list.setTitle(request.getTitle());
        applyLinkAccess(list, request.getLinkAccess());

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
    public User requireWriteUser(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("error.shoppingList.signInToChange");
        }
        return requireUser(userId);
    }

    private User requireUser(UUID userId) {
        return userRepository.requireActive(userId);
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
