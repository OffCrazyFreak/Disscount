package disscount.shoppingList.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import disscount.exceptions.BadRequestException;
import disscount.exceptions.UnauthorizedException;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingList.service.ShoppingListService;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {

    @Mock
    private ShoppingListRepository shoppingListRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private ShoppingListService shoppingListService;

    private User testUser;
    private User otherUser;
    private UUID testUserId;
    private UUID otherUserId;

    @BeforeEach
    void setUp() {
        testUserId = UUID.randomUUID();
        otherUserId = UUID.randomUUID();

        testUser = User.builder()
                .id(testUserId)
                .email("test@example.com")
                .username("testuser")
                .build();

        otherUser = User.builder()
                .id(otherUserId)
                .email("other@example.com")
                .username("otheruser")
                .build();
    }

    @Test
    void createShoppingList_Success() {
        // Arrange
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("Weekly Groceries");
        request.setIsPublic(true);
        request.setAiPrompt("Help me plan meals");

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        
        ShoppingList savedList = ShoppingList.builder()
                .id(UUID.randomUUID())
                .owner(testUser)
                .title(request.getTitle())
                .isPublic(request.getIsPublic())
                .aiPrompt(request.getAiPrompt())
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(shoppingListRepository.save(any(ShoppingList.class))).thenReturn(savedList);

        // Act
        ShoppingListDto result = shoppingListService.createShoppingList(testUserId, request);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Weekly Groceries");
        assertThat(result.getIsPublic()).isTrue();
        assertThat(result.getAiPrompt()).isEqualTo("Help me plan meals");
        assertThat(result.getOwnerId()).isEqualTo(testUserId);

        verify(userRepository).findById(testUserId);
        verify(shoppingListRepository).save(any(ShoppingList.class));
    }

    @Test
    void createShoppingList_WithDefaultIsPublic() {
        // Arrange
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("Simple List");
        request.setIsPublic(null); // Test default value

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        
        ShoppingList savedList = ShoppingList.builder()
                .id(UUID.randomUUID())
                .owner(testUser)
                .title(request.getTitle())
                .isPublic(false)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(shoppingListRepository.save(any(ShoppingList.class))).thenReturn(savedList);

        // Act
        ShoppingListDto result = shoppingListService.createShoppingList(testUserId, request);

        // Assert
        assertThat(result.getIsPublic()).isFalse();
    }

    @Test
    void createShoppingList_UserNotFound() {
        // Arrange
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("Test List");

        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.createShoppingList(testUserId, request))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User not found");

        verify(userRepository).findById(testUserId);
        verify(shoppingListRepository, never()).save(any());
    }

    @Test
    void getUserShoppingLists_Success() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));

        ShoppingList list1 = createMockShoppingList(UUID.randomUUID(), "List 1", false, testUser);
        ShoppingList list2 = createMockShoppingList(UUID.randomUUID(), "List 2", true, testUser);

        when(shoppingListRepository.findActiveByOwner(testUser))
                .thenReturn(List.of(list1, list2));

        // Act
        List<ShoppingListDto> result = shoppingListService.getUserShoppingLists(testUserId);

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getTitle()).isEqualTo("List 1");
        assertThat(result.get(1).getTitle()).isEqualTo("List 2");

        verify(userRepository).findById(testUserId);
        verify(shoppingListRepository).findActiveByOwner(testUser);
    }

    @Test
    void getUserShoppingLists_EmptyList() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByOwner(testUser))
                .thenReturn(new ArrayList<>());

        // Act
        List<ShoppingListDto> result = shoppingListService.getUserShoppingLists(testUserId);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void getUserShoppingLists_UserNotFound() {
        // Arrange
        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.getUserShoppingLists(testUserId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getShoppingListById_Success_Owner() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingList list = createMockShoppingList(listId, "My List", false, testUser);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.of(list));

        // Act
        Optional<ShoppingListDto> result = shoppingListService.getShoppingListById(listId, testUserId);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(listId);
        assertThat(result.get().getTitle()).isEqualTo("My List");

        verify(shoppingListRepository).findActiveByIdAndOwner(listId, testUser);
    }

    @Test
    void getShoppingListById_Success_PublicList() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingList publicList = createMockShoppingList(listId, "Public List", true, otherUser);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.empty());
        when(shoppingListRepository.findActiveById(listId))
                .thenReturn(Optional.of(publicList));

        // Act
        Optional<ShoppingListDto> result = shoppingListService.getShoppingListById(listId, testUserId);

        // Assert
        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(listId);
        assertThat(result.get().getIsPublic()).isTrue();
    }

    @Test
    void getShoppingListById_NotFound_PrivateListOfAnotherUser() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingList privateList = createMockShoppingList(listId, "Private List", false, otherUser);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.empty());
        when(shoppingListRepository.findActiveById(listId))
                .thenReturn(Optional.of(privateList));

        // Act
        Optional<ShoppingListDto> result = shoppingListService.getShoppingListById(listId, testUserId);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void getShoppingListById_NotFound() {
        // Arrange
        UUID listId = UUID.randomUUID();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.empty());
        when(shoppingListRepository.findActiveById(listId))
                .thenReturn(Optional.empty());

        // Act
        Optional<ShoppingListDto> result = shoppingListService.getShoppingListById(listId, testUserId);

        // Assert
        assertThat(result).isEmpty();
    }

    @Test
    void updateShoppingList_Success() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingList existingList = createMockShoppingList(listId, "Original Title", false, testUser);

        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setIsPublic(true);
        updateRequest.setAiPrompt("New prompt");

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.of(existingList));
        when(shoppingListRepository.save(any(ShoppingList.class)))
                .thenReturn(existingList);

        // Act
        ShoppingListDto result = shoppingListService.updateShoppingList(listId, testUserId, updateRequest);

        // Assert
        assertThat(result).isNotNull();
        assertThat(result.getTitle()).isEqualTo("Updated Title");
        assertThat(result.getIsPublic()).isTrue();
        assertThat(result.getAiPrompt()).isEqualTo("New prompt");

        verify(shoppingListRepository).save(existingList);
    }

    @Test
    void updateShoppingList_NotFound() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.updateShoppingList(listId, testUserId, updateRequest))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Shopping list not found");

        verify(shoppingListRepository, never()).save(any());
    }

    @Test
    void updateShoppingList_UserNotFound() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");

        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.updateShoppingList(listId, testUserId, updateRequest))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void deleteShoppingList_Success() {
        // Arrange
        UUID listId = UUID.randomUUID();
        ShoppingList list = createMockShoppingList(listId, "To Delete", false, testUser);

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.of(list));
        when(shoppingListRepository.save(any(ShoppingList.class)))
                .thenReturn(list);

        // Act
        shoppingListService.deleteShoppingList(listId, testUserId);

        // Assert
        assertThat(list.getDeletedAt()).isNotNull();
        verify(shoppingListRepository).save(list);
    }

    @Test
    void deleteShoppingList_NotFound() {
        // Arrange
        UUID listId = UUID.randomUUID();

        when(userRepository.findById(testUserId)).thenReturn(Optional.of(testUser));
        when(shoppingListRepository.findActiveByIdAndOwner(listId, testUser))
                .thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.deleteShoppingList(listId, testUserId))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Shopping list not found");

        verify(shoppingListRepository, never()).save(any());
    }

    @Test
    void deleteShoppingList_UserNotFound() {
        // Arrange
        UUID listId = UUID.randomUUID();

        when(userRepository.findById(testUserId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThatThrownBy(() -> shoppingListService.deleteShoppingList(listId, testUserId))
                .isInstanceOf(UnauthorizedException.class)
                .hasMessageContaining("User not found");
    }

    @Test
    void getPublicShoppingLists_Success() {
        // Arrange
        ShoppingList list1 = createMockShoppingList(UUID.randomUUID(), "Public 1", true, testUser);
        ShoppingList list2 = createMockShoppingList(UUID.randomUUID(), "Public 2", true, otherUser);

        when(shoppingListRepository.findActivePublicLists())
                .thenReturn(List.of(list1, list2));

        // Act
        List<ShoppingListDto> result = shoppingListService.getPublicShoppingLists();

        // Assert
        assertThat(result).hasSize(2);
        assertThat(result.get(0).getIsPublic()).isTrue();
        assertThat(result.get(1).getIsPublic()).isTrue();

        verify(shoppingListRepository).findActivePublicLists();
    }

    @Test
    void getPublicShoppingLists_EmptyList() {
        // Arrange
        when(shoppingListRepository.findActivePublicLists())
                .thenReturn(new ArrayList<>());

        // Act
        List<ShoppingListDto> result = shoppingListService.getPublicShoppingLists();

        // Assert
        assertThat(result).isEmpty();
    }

    // Helper method to create mock shopping lists
    private ShoppingList createMockShoppingList(UUID id, String title, boolean isPublic, User owner) {
        return ShoppingList.builder()
                .id(id)
                .owner(owner)
                .title(title)
                .isPublic(isPublic)
                .items(new ArrayList<>())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }
}
