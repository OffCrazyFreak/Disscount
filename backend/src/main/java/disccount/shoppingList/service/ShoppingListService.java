package disccount.shoppingList.service;

import disccount.shoppingList.dao.ShoppingListRepository;
import disccount.shoppingList.domain.ShoppingList;
import disccount.shoppingList.dto.ShoppingListDto;
import disccount.shoppingListItem.dto.ShoppingListItemDto;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import disccount.shoppingList.dto.ShoppingListRequest;
import disccount.exceptions.BadRequestException;
import disccount.exceptions.UnauthorizedException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ShoppingListService {

    private final ShoppingListRepository shoppingListRepository;
    private final UserRepository userRepository;

    public ShoppingListDto createShoppingList(UUID ownerId, ShoppingListRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = ShoppingList.builder()
                .owner(owner)
                .title(request.getTitle())
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : false)
                .aiPrompt(request.getAiPrompt())
                .build();

        shoppingList = shoppingListRepository.save(shoppingList);
        return convertToDto(shoppingList);
    }

    public List<ShoppingListDto> getUserShoppingLists(UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return shoppingListRepository.findActiveByOwner(owner)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public Optional<ShoppingListDto> getShoppingListById(UUID listId, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // First try to get as owner
        Optional<ShoppingList> shoppingListOpt = shoppingListRepository.findActiveByIdAndOwner(listId, owner);
        
        // If not found and not owner, try to get public list
        if (shoppingListOpt.isEmpty()) {
            shoppingListOpt = shoppingListRepository.findActiveById(listId)
                    .filter(list -> list.getIsPublic());
        }

        return shoppingListOpt.map(this::convertToDto);
    }

    public ShoppingListDto updateShoppingList(UUID listId, UUID ownerId, ShoppingListRequest request) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found"));

        // Update fields
        shoppingList.setTitle(request.getTitle());
        shoppingList.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : false);
        shoppingList.setAiPrompt(request.getAiPrompt());

        shoppingList = shoppingListRepository.save(shoppingList);
        return convertToDto(shoppingList);
    }

    public void deleteShoppingList(UUID listId, UUID ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        ShoppingList shoppingList = shoppingListRepository.findActiveByIdAndOwner(listId, owner)
                .orElseThrow(() -> new BadRequestException("Shopping list not found"));

        shoppingList.setDeletedAt(LocalDateTime.now());
        shoppingListRepository.save(shoppingList);
    }

    public List<ShoppingListDto> getPublicShoppingLists() {
        return shoppingListRepository.findActivePublicLists()
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    private ShoppingListDto convertToDto(ShoppingList shoppingList) {
        List<ShoppingListItemDto> itemDtos = shoppingList.getItems().stream()
                .filter(item -> item.getDeletedAt() == null)
                .map(item -> ShoppingListItemDto.builder()
                        .id(item.getId())
                        .shoppingListId(item.getShoppingList().getId())
                        .productApiId(item.getProductApiId())
                        .productName(item.getProductName())
                        .amount(item.getAmount())
                        .isChecked(item.getIsChecked())
                        .createdAt(item.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return ShoppingListDto.builder()
                .id(shoppingList.getId())
                .ownerId(shoppingList.getOwner().getId())
                .title(shoppingList.getTitle())
                .isPublic(shoppingList.getIsPublic())
                .aiPrompt(shoppingList.getAiPrompt())
                .aiAnswer(shoppingList.getAiAnswer())
                .updatedAt(shoppingList.getUpdatedAt())
                .createdAt(shoppingList.getCreatedAt())
                .items(itemDtos)
                .build();
    }
}
