package disscount.shoppingList.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ListAccess;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * The owner's view of their own lists. Everything here is owner-only; access granted by a
 * share link runs through {@link SharedShoppingListService} instead.
 */
@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;
    private final ShoppingListMapper shoppingListMapper;

    public ShoppingListDto createShoppingList(UUID ownerId, ShoppingListRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // New lists are always private, which also makes "copy list" private by construction.
        // Sharing needs a persisted id to bind a token to, so it is turned on afterwards.
        ShoppingList shoppingList = ShoppingList.builder()
                .owner(owner)
                .title(request.getTitle())
                .build();

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    // Read-only: the class-level @Transactional would otherwise keep a dirty-checking
    // flush at commit for a query that never writes.
    @Transactional(readOnly = true)
    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListRepository.findActiveByOwner(owner)
                .stream()
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<ShoppingListDto> getShoppingListById(UUID listId, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .map(list -> shoppingListMapper.toDto(list, ListAccess.OWNER));
    }

    public ShoppingListDto updateShoppingList(UUID listId, UUID ownerId, ShoppingListRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found"));

        shoppingList.setTitle(request.getTitle());
        applyLinkAccess(shoppingList, request.getLinkAccess());

        shoppingList = shoppingListRepository.save(shoppingList);
        return shoppingListMapper.toDto(shoppingList, ListAccess.OWNER);
    }

    public void deleteShoppingList(UUID listId, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found"));

        shoppingList.setDeletedAt(Timestamps.nowUtc());
        shoppingListRepository.save(shoppingList);
    }

    /**
     * Re-enabling a link mints a fresh token, so turning sharing off and on again is a real
     * revoke. Merely changing the level leaves the token alone, since the people already
     * holding the link are meant to keep working at the new level.
     */
    private void applyLinkAccess(ShoppingList list, ListAccess requested) {
        if (requested == null || requested == list.resolvedLinkAccess()) {
            return;
        }
        if (requested == ListAccess.OWNER) {
            throw new BadRequestException("OWNER is not a link access level");
        }

        if (requested == ListAccess.NONE) {
            list.setLinkAccess(null);
            list.setShareToken(null);
            return;
        }

        list.setLinkAccess(requested);
        if (list.getShareToken() == null) {
            list.setShareToken(UUID.randomUUID());
        }
    }
}
