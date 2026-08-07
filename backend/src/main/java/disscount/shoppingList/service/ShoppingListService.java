package disscount.shoppingList.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.ForbiddenException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.LinkAccess;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Every path to a shopping list, for owners and link visitors alike.
 *
 * <p>The by-id methods run on a chain where a bearer token is optional, so {@code userId} may
 * be null and the framework guarantees nothing. Authorization is therefore this class's job:
 * each one loads the list, resolves the caller's access through
 * {@link ShoppingListAccessService}, and refuses before touching anything.
 */
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

        // A new list can be born shared, which is what the copy modal's sharing option needs.
        applyLinkAccess(shoppingList, request.getLinkAccess());

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    // Read-only: the class-level @Transactional would otherwise keep a dirty-checking
    // flush at commit for a query that never writes.
    @Transactional(readOnly = true)
    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        User owner = requireUser(ownerId);

        return shoppingListRepository.findActiveByOwner(owner)
                .stream()
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    /**
     * The caller may be anonymous, so this resolves rather than assuming ownership.
     *
     * <p>A list the caller cannot see answers {@link NotFoundException}, never
     * {@link ForbiddenException}: a 403 would confirm the list exists, and since the id is
     * now the shareable URL, that is exactly what must not leak.
     */
    @Transactional(readOnly = true)
    public ShoppingListDto getShoppingListById(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);
        return shoppingListMapper.toDto(list, accessService.resolve(list, userId));
    }

    /**
     * Two different checks in one endpoint, deliberately kept apart: renaming needs
     * {@code canEditItems}, but changing who can reach the list needs {@code canManageShare}.
     * Folding them together would let an EDIT recipient reshare a list they do not own.
     */
    public ShoppingListDto updateShoppingList(UUID listId, UUID userId, ShoppingListRequest request) {
        ShoppingList list = findVisible(listId, userId);
        ListAccess access = accessService.resolve(list, userId);

        if (request.getLinkAccess() != null && !access.canManageShare()) {
            throw new ForbiddenException("Only the owner can change who has access");
        }

        requireWriteUser(userId);
        if (!access.canEditItems()) {
            throw new ForbiddenException("Insufficient access to this shopping list");
        }

        list.setTitle(request.getTitle());
        applyLinkAccess(list, request.getLinkAccess());

        return shoppingListMapper.toDto(shoppingListRepository.save(list), access);
    }

    public void deleteShoppingList(UUID listId, UUID userId) {
        ShoppingList list = findVisible(listId, userId);

        if (!accessService.resolve(list, userId).isOwner()) {
            throw new ForbiddenException("Only the owner can delete this shopping list");
        }

        list.setDeletedAt(Timestamps.nowUtc());
        shoppingListRepository.save(list);
    }

    /**
     * Loads a list the caller is allowed to know about, or throws not-found.
     *
     * <p>The visibility branch comes first, before any other check, so no later code path can
     * answer differently and reveal that an id was real.
     */
    public ShoppingList findVisible(UUID listId, UUID userId) {
        ShoppingList list = shoppingListRepository.findActiveById(listId)
                .orElseThrow(() -> new NotFoundException("Shopping list not found"));

        if (!accessService.resolve(list, userId).canView()) {
            throw new NotFoundException("Shopping list not found");
        }

        return list;
    }

    /**
     * Anonymous callers are capped at VIEW, so every write needs a real account behind it and
     * every write stays attributable.
     */
    public User requireWriteUser(UUID userId) {
        if (userId == null) {
            throw new UnauthorizedException("Sign in to change this shopping list");
        }
        return requireUser(userId);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    /**
     * Turning sharing off and back on hands back the same URL, because the URL is the list's
     * own id. That is the accepted cost of dropping the rotating token: a link that was once
     * shared works again if sharing is re-enabled.
     */
    private void applyLinkAccess(ShoppingList list, LinkAccess requested) {
        if (requested == null) {
            return;
        }

        ListAccess next = requested.toListAccess();
        list.setLinkAccess(next == ListAccess.NONE ? null : next);
    }
}
