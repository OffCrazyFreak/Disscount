package disscount.shoppingList.rest;

import com.fasterxml.jackson.databind.ObjectMapper;

import disscount.Application;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.shoppingList.domain.ShoppingList;
import disscount.shoppingList.dto.ShoppingListDto;
import disscount.shoppingList.dto.ShoppingListRequest;
import disscount.shoppingList.service.ShoppingListService;
import disscount.shoppingListItem.dao.ShoppingListItemRepository;
import disscount.shoppingListItem.domain.ShoppingListItem;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(classes = Application.class, webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc(addFilters = false)
@Transactional
@ActiveProfiles("test")
class ShoppingListControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShoppingListRepository shoppingListRepository;
    
    @Autowired
    private ShoppingListItemRepository shoppingListItemRepository;

    @Autowired
    private ShoppingListService shoppingListService;

    private User testUser;
    private User otherUser;

    @BeforeEach
    void setUp() {
        // Clear data
        shoppingListRepository.deleteAll();
        userRepository.deleteAll();

        // Create test users
        testUser = User.builder()
                .email("test@example.com")
                .username("testuser")
                .passwordHash("hashedpassword")
                .build();
        testUser = userRepository.save(testUser);

        otherUser = User.builder()
                .email("other@example.com")
                .username("otheruser")
                .passwordHash("hashedpassword")
                .build();
        otherUser = userRepository.save(otherUser);

        // Set up security context with test user
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(testUser.getId().toString(), null, new ArrayList<>())
        );
    }

    @Test
    void createShoppingList_Success() throws Exception {
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("Weekly Groceries");
        request.setIsPublic(false);
        request.setAiPrompt("Help me plan meals for a week");

        mockMvc.perform(post("/api/shopping-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.title").value("Weekly Groceries"))
                .andExpect(jsonPath("$.isPublic").value(false))
                .andExpect(jsonPath("$.aiPrompt").value("Help me plan meals for a week"))
                .andExpect(jsonPath("$.ownerId").value(testUser.getId().toString()))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.updatedAt").exists())
                .andExpect(jsonPath("$.items").isArray());
    }

    @Test
    void createShoppingList_WithoutOptionalFields() throws Exception {
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("Simple List");

        mockMvc.perform(post("/api/shopping-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Simple List"))
                .andExpect(jsonPath("$.isPublic").value(false))
                .andExpect(jsonPath("$.aiPrompt").isEmpty());
    }

    @Test
    void createShoppingList_ValidationError_EmptyTitle() throws Exception {
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle("");

        mockMvc.perform(post("/api/shopping-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void createShoppingList_ValidationError_NullTitle() throws Exception {
        ShoppingListRequest request = new ShoppingListRequest();
        request.setTitle(null);

        mockMvc.perform(post("/api/shopping-lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getCurrentUserShoppingLists_Success() throws Exception {
        // Create multiple shopping lists
        createTestShoppingList("List 1", false, testUser);
        createTestShoppingList("List 2", true, testUser);
        createTestShoppingList("List 3", false, testUser);
        
        // Create a list for another user (should not be returned)
        createTestShoppingList("Other User List", false, otherUser);

        mockMvc.perform(get("/api/shopping-lists/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(3)))
                .andExpect(jsonPath("$[*].title", containsInAnyOrder("List 1", "List 2", "List 3")));
    }

    @Test
    void getCurrentUserShoppingLists_EmptyList() throws Exception {
        mockMvc.perform(get("/api/shopping-lists/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    @Test
    void getCurrentUserShoppingLists_ExcludesDeletedLists() throws Exception {
        ShoppingList list1 = createTestShoppingList("Active List", false, testUser);
        ShoppingList list2 = createTestShoppingList("Deleted List", false, testUser);
        
        // Soft delete list2
        list2.setDeletedAt(LocalDateTime.now());
        shoppingListRepository.save(list2);

        mockMvc.perform(get("/api/shopping-lists/me")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].title").value("Active List"));
    }

    @Test
    void getShoppingListById_Success_Owner() throws Exception {
        ShoppingList list = createTestShoppingList("My List", false, testUser);

        mockMvc.perform(get("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(list.getId().toString()))
                .andExpect(jsonPath("$.title").value("My List"))
                .andExpect(jsonPath("$.ownerId").value(testUser.getId().toString()));
    }

    @Test
    void getShoppingListById_Success_PublicList() throws Exception {
        ShoppingList publicList = createTestShoppingList("Public List", true, otherUser);

        mockMvc.perform(get("/api/shopping-lists/{id}", publicList.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(publicList.getId().toString()))
                .andExpect(jsonPath("$.title").value("Public List"))
                .andExpect(jsonPath("$.isPublic").value(true));
    }

    @Test
    void getShoppingListById_NotFound_PrivateListOfAnotherUser() throws Exception {
        ShoppingList privateList = createTestShoppingList("Private List", false, otherUser);

        mockMvc.perform(get("/api/shopping-lists/{id}", privateList.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void getShoppingListById_NotFound_NonExistentId() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(get("/api/shopping-lists/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void getShoppingListById_NotFound_DeletedList() throws Exception {
        ShoppingList list = createTestShoppingList("Deleted List", false, testUser);
        list.setDeletedAt(LocalDateTime.now());
        shoppingListRepository.save(list);

        mockMvc.perform(get("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateShoppingList_Success() throws Exception {
        ShoppingList list = createTestShoppingList("Original Title", false, testUser);

        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");
        updateRequest.setIsPublic(true);
        updateRequest.setAiPrompt("New AI prompt");

        mockMvc.perform(put("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(list.getId().toString()))
                .andExpect(jsonPath("$.title").value("Updated Title"))
                .andExpect(jsonPath("$.isPublic").value(true))
                .andExpect(jsonPath("$.aiPrompt").value("New AI prompt"));
    }

    @Test
    void updateShoppingList_ValidationError_EmptyTitle() throws Exception {
        ShoppingList list = createTestShoppingList("Original Title", false, testUser);

        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("");

        mockMvc.perform(put("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateShoppingList_NotFound_NotOwner() throws Exception {
        ShoppingList list = createTestShoppingList("Other's List", false, otherUser);

        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");

        mockMvc.perform(put("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void updateShoppingList_NotFound_NonExistentId() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        ShoppingListRequest updateRequest = new ShoppingListRequest();
        updateRequest.setTitle("Updated Title");

        mockMvc.perform(put("/api/shopping-lists/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteShoppingList_Success() throws Exception {
        ShoppingList list = createTestShoppingList("To Delete", false, testUser);
        UUID listId = list.getId();

        mockMvc.perform(delete("/api/shopping-lists/{id}", listId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNoContent());

        // Verify soft delete
        ShoppingList deletedList = shoppingListRepository.findById(listId).orElse(null);
        assertThat(deletedList).isNotNull();
        assertThat(deletedList.getDeletedAt()).isNotNull();
    }

    @Test
    void deleteShoppingList_NotFound_NotOwner() throws Exception {
        ShoppingList list = createTestShoppingList("Other's List", false, otherUser);

        mockMvc.perform(delete("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteShoppingList_NotFound_NonExistentId() throws Exception {
        UUID nonExistentId = UUID.randomUUID();

        mockMvc.perform(delete("/api/shopping-lists/{id}", nonExistentId)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

    @Test
    void deleteShoppingList_NotFound_AlreadyDeleted() throws Exception {
        ShoppingList list = createTestShoppingList("Already Deleted", false, testUser);
        list.setDeletedAt(LocalDateTime.now());
        shoppingListRepository.save(list);

        mockMvc.perform(delete("/api/shopping-lists/{id}", list.getId())
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
    }

   
    @Test
    void getAllUserShoppingListItems_EmptyWhenNoLists() throws Exception {
        mockMvc.perform(get("/api/shopping-lists/items")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$", hasSize(0)));
    }

    // Helper method to create test shopping lists
    private ShoppingList createTestShoppingList(String title, boolean isPublic, User owner) {
        ShoppingList list = ShoppingList.builder()
                .owner(owner)
                .title(title)
                .isPublic(isPublic)
                .build();
        return shoppingListRepository.save(list);
    }
}
