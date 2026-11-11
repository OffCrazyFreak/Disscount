package disscount.user;

import disscount.contact.ContactMessage;
import disscount.contact.ContactMessageRepository;
import disscount.digitalcard.photo.DigitalCardPhotoRepository;
import disscount.digitalcard.DigitalCardRepository;
import disscount.digitalcard.photo.PhotoCleanupRepository;
import disscount.preferences.favoritestore.FavoriteStoreRepository;
import disscount.preferences.pinnedstore.PinnedStoreRepository;
import disscount.productimage.ImageSource;
import disscount.productimage.ProductImageRepository;
import disscount.shared.FakePhotoStore;
import disscount.shared.TestImages;
import disscount.shoppinglist.ShoppingListRepository;
import disscount.storename.StoreNameSuggestionRepository;
import disscount.storename.StoreNameUsageRepository;
import disscount.support.FullStackTest;
import disscount.support.IncludingDeleted;
import disscount.watchlist.WatchlistItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** In the root package because the pieces it checks sit in packages a single feature's test cannot see. */
class AccountErasureTest extends FullStackTest {

    @Autowired DigitalCardRepository cards;
    @Autowired DigitalCardPhotoRepository cardPhotos;
    @Autowired PhotoCleanupRepository photoCleanup;
    @Autowired FavoriteStoreRepository favoriteStores;
    @Autowired StoreNameUsageRepository storeNameUsages;
    @Autowired StoreNameSuggestionRepository storeNames;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired ProductImageRepository productImages;
    @Autowired ShoppingListRepository shoppingLists;
    @Autowired WatchlistItemRepository watchlist;
    @Autowired PinnedStoreRepository pinnedStores;
    @Autowired ContactMessageRepository contactMessages;

    private static RequestPostProcessor erasureToken(User user) {
        return jwt().jwt(j -> j.subject(user.getId().toString()).claim("purpose", "account-erasure"));
    }

    private static MockHttpServletRequestBuilder withJson(MockHttpServletRequestBuilder request, String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private void giveEverything(User user, String customStore) throws Exception {
        UUID cardId = UUID.randomUUID();
        mvc.perform(withJson(put("/api/digital-cards/{id}", cardId), """
                {"cardName":"Moja","cardType":"loyalty","storeName":"%s","codeValue":"123","codeType":"ean_13","cardColor":"#D50000"}
                """.formatted(customStore)).with(as(user))).andExpect(status().isOk());
        mvc.perform(multipart(HttpMethod.PUT, "/api/digital-cards/{id}/photos/{slot}", cardId, "icon")
                .file(new MockMultipartFile("full", "icon.webp", "image/webp", TestImages.webp(32, 32)))
                .with(as(user))).andExpect(status().isOk());
        mvc.perform(multipart("/api/products/{ean}/images", "3850123456789")
                .file(new MockMultipartFile("photo", "p.jpg", "image/jpeg", TestImages.jpeg(400, 300)))
                .with(as(user))).andExpect(status().isOk());
        mvc.perform(withJson(put("/api/favorite-stores/bulk"), "{\"stores\":[{\"storeKey\":\"konzum:1\"}]}").with(as(user)))
                .andExpect(status().isOk());
        mvc.perform(withJson(put("/api/pinned-stores/bulk"), "{\"stores\":[{\"storeApiId\":\"konzum:1\",\"storeName\":\"Konzum\"}]}")
                .with(as(user))).andExpect(status().isOk());
        mvc.perform(withJson(post("/api/shopping-lists"), "{\"title\":\"Tjedna kupnja\",\"linkAccess\":\"EDIT\"}").with(as(user)))
                .andExpect(status().isOk());
        mvc.perform(withJson(post("/api/watchlist"), "{\"productApiId\":\"3850123456789\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":10}")
                .with(as(user))).andExpect(status().isOk());

        // Saved directly, as the per-address contact limit is shared by every test in this context.
        String email = loginEmailOf(user);
        when(authIdentityDao.findEmail(user.getId())).thenReturn(Optional.of(email));
        contactMessages.save(contactMessage(user.getId(), email, "Signed in"));
        contactMessages.save(contactMessage(null, email.toUpperCase(), "Signed out"));
    }

    private static String loginEmailOf(User user) {
        return user.getId() + "@example.com";
    }

    private static ContactMessage contactMessage(UUID senderId, String email, String subject) {
        return ContactMessage.builder()
                .senderId(senderId)
                .email(email)
                .fullName("Ana Anić")
                .subject(subject)
                .message("Cijene u Konzumu su krive.")
                .build();
    }

    private List<UUID> messageIdsFrom(User user) {
        return contactMessages.findAll().stream()
                .filter(message -> user.getId().equals(message.getSenderId())
                        || loginEmailOf(user).equalsIgnoreCase(message.getEmail()))
                .map(ContactMessage::getId)
                .toList();
    }

    private UUID sharedListOf(User user) {
        return shoppingLists.findActiveByOwnerId(user.getId()).getFirst().getId();
    }

    private int useCountOf(String store) {
        return storeNames.findAll().stream().filter(s -> s.getName().equals(store)).findFirst().orElseThrow().getUseCount();
    }

    private void assertErased(User leaving) {
        UUID id = leaving.getId();
        User profile = IncludingDeleted.find(entityManager, User.class, id).orElseThrow();
        assertThat(profile.getDeletedAt()).isNotNull();
        assertThat(profile.getUsername()).isNull();
        assertThat(profile.getImage()).isNull();
        assertThat(erasureLedger.findById(id)).isPresent();

        assertThat(cards.findAll()).noneMatch(card -> card.getUserId().equals(id));
        assertThat(cardPhotos.findAll()).noneMatch(photo -> photo.getFullKey().contains(id.toString()));
        assertThat(((FakePhotoStore) photoStore).objects.keySet()).noneMatch(key -> key.contains(id.toString()));
        assertThat(photoCleanup.findAll()).noneMatch(row -> row.getKeyOrPrefix().contains(id.toString()));
        assertThat(favoriteStores.findByUserId(id)).isEmpty();
        // Product photos lose every link to the person, and a kept photo loses its private original.
        assertThat(productImages.findByContributorId(id)).isEmpty();
        assertThat(productImages.findByConfirmedById(id)).isEmpty();
        assertThat(productImages.findAll())
                .filteredOn(image -> image.getContributorId() == null && image.getSource() != ImageSource.OPEN_FOOD_FACTS)
                .allMatch(image -> image.getOriginalKey() == null);
        assertThat(((FakePhotoStore) productOriginalStore).objects.keySet()).allMatch(key ->
                productImages.findAll().stream().anyMatch(image -> key.equals(image.getOriginalKey())));
        assertThat(storeNameUsages.findAll()).noneMatch(usage -> usage.getUserId().equals(id));

        // The list stays with the hidden profile, and its link no longer opens it for anyone.
        assertThat(shoppingLists.findActiveByOwnerId(id)).singleElement()
                .satisfies(list -> assertThat(list.getLinkAccess()).isNull());

        // A message keeps its text and loses who sent it, whether sent signed in or signed out from the login address.
        assertThat(contactMessages.findAll())
                .filteredOn(message -> id.equals(message.getSenderId()))
                .singleElement()
                .satisfies(message -> {
                    assertThat(message.getEmail()).isNull();
                    assertThat(message.getFullName()).isNull();
                    assertThat(message.getMessage()).isEqualTo("Cijene u Konzumu su krive.");
                });
        assertThat(contactMessages.findAll()).noneMatch(message -> loginEmailOf(leaving).equalsIgnoreCase(message.getEmail()));

        // These stay, attached to the hidden profile (owner, 2026-11-11).
        assertThat(watchlist.findByUserId(id)).hasSize(1);
        assertThat(pinnedStores.findByUserId(id)).hasSize(1);
    }

    @Test
    void theErasureTokenRemovesPersonalDataAndKeepsWhatTheOwnerChoseToKeep() throws Exception {
        String store = "Dućan " + UUID.randomUUID().toString().substring(0, 8);
        User leaving = newUser("leaving");
        User staying = newUser("staying");
        giveEverything(leaving, store);
        giveEverything(staying, store);
        assertThat(useCountOf(store)).isEqualTo(2);

        mvc.perform(delete("/api/users/me").with(erasureToken(leaving)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User deleted successfully"));

        assertErased(leaving);
        assertThat(useCountOf(store)).isEqualTo(1);
        assertThat(cards.findActiveByUserId(staying.getId())).hasSize(1);
        assertThat(favoriteStores.findByUserId(staying.getId())).hasSize(1);
        assertThat(shoppingLists.findActiveByOwnerId(staying.getId())).singleElement()
                .satisfies(list -> assertThat(list.getLinkAccess()).isNotNull());
        assertThat(watchlist.findByUserId(staying.getId())).hasSize(1);
        assertThat(pinnedStores.findByUserId(staying.getId())).hasSize(1);
        assertThat(contactMessages.findAll())
                .filteredOn(message -> loginEmailOf(staying).equalsIgnoreCase(message.getEmail()))
                .hasSize(2)
                .allMatch(message -> message.getFullName() != null);
    }

    // Same answer as for an unknown id, so the link says nothing about the account that made it.
    @Test
    void aLinkVisitorOfAnErasedOwnersListGetsWhatAnUnknownLinkGets() throws Exception {
        User leaving = newUser("leaving");
        User visitor = newUser("visitor");
        giveEverything(leaving, "Dućan " + UUID.randomUUID().toString().substring(0, 8));
        UUID listId = sharedListOf(leaving);
        mvc.perform(get("/api/shopping-lists/{id}", listId).with(as(visitor))).andExpect(status().isOk());

        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());

        String unknown = body(mvc.perform(get("/api/shopping-lists/{id}", UUID.randomUUID()).with(as(visitor)))
                .andExpect(status().isNotFound())).get("detail").asString();
        for (RequestPostProcessor caller : List.<RequestPostProcessor>of(as(visitor), request -> request)) {
            mvc.perform(get("/api/shopping-lists/{id}", listId).with(caller))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.detail").value(unknown));
        }
        mvc.perform(withJson(put("/api/shopping-lists/{id}", listId), "{\"title\":\"Moj popis\"}").with(as(visitor)))
                .andExpect(status().isNotFound());
        mvc.perform(withJson(post("/api/shopping-lists/{id}/items", listId), "{\"name\":\"Mlijeko\"}").with(as(visitor)))
                .andExpect(status().isNotFound());
    }

    @Test
    void aSecondErasureChangesNothing() throws Exception {
        User leaving = newUser("leaving");
        giveEverything(leaving, "Dućan " + UUID.randomUUID().toString().substring(0, 8));
        List<UUID> messages = messageIdsFrom(leaving);
        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());
        String afterFirst = snapshotOf(leaving, messages);

        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());

        assertThat(messages).hasSize(2);
        assertThat(snapshotOf(leaving, messages)).isEqualTo(afterFirst);
    }

    private String snapshotOf(User user, List<UUID> messageIds) {
        entityManager.clear();
        User profile = IncludingDeleted.find(entityManager, User.class, user.getId()).orElseThrow();
        return List.of(
                String.valueOf(profile.getDeletedAt()),
                String.valueOf(erasureLedger.findById(user.getId()).orElseThrow().getErasedAt()),
                shoppingLists.findActiveByOwnerId(user.getId()).stream()
                        .map(list -> list.getId() + ":" + list.getLinkAccess() + ":" + list.getUpdatedAt()).toList().toString(),
                contactMessages.findAllById(messageIds).stream()
                        .map(message -> message.getId() + ":" + message.getEmail() + ":" + message.getFullName()
                                + ":" + message.getUpdatedAt()).sorted().toList().toString()
        ).toString();
    }

    // better-auth calls this before deleting any identity, including one that never made a request here.
    @Test
    void anIdentityWithoutAProfileIsErasedAndTombstoned() throws Exception {
        UUID neverSeen = UUID.randomUUID();

        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(neverSeen.toString()).claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());

        assertThat(IncludingDeleted.find(entityManager, User.class, neverSeen)).isEmpty();
        assertThat(erasureLedger.findById(neverSeen)).isPresent();
    }

    @Test
    void aRepeatedErasureStillSucceeds() throws Exception {
        User leaving = newUser("leaving");
        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());

        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());
        assertThat(erasureLedger.findById(leaving.getId())).isPresent();
    }

    @Test
    void aSessionThatOutlivedTheErasureIsTold410InsteadOfRevivingTheProfile() throws Exception {
        User leaving = newUser("leaving");
        mvc.perform(delete("/api/users/me").with(erasureToken(leaving))).andExpect(status().isOk());

        mvc.perform(get("/api/users/me").with(jwt().jwt(j -> j.subject(leaving.getId().toString())
                        .claim("email", "leaving@example.com"))))
                .andExpect(status().isGone())
                .andExpect(content().json("{\"code\":\"account_erased\",\"userId\":\"" + leaving.getId() + "\"}"));
        assertThat(IncludingDeleted.find(entityManager, User.class, leaving.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void anAdminDeleteRunsTheSameErasureAndLeavesTheIdentityToNextJs() throws Exception {
        User admin = newAdmin();
        User leaving = newUser("leaving");
        giveEverything(leaving, "Dućan " + UUID.randomUUID().toString().substring(0, 8));

        mvc.perform(delete("/api/admin/users/{id}", leaving.getId()).with(as(admin))).andExpect(status().isOk());

        assertErased(leaving);
    }

    // A minted token outlives its account by minutes, so each write refuses the deleted caller itself.
    @Test
    void everyWriteByADeletedAccountIs401() throws Exception {
        User gone = newUser("gone");
        gone.setDeletedAt(java.time.LocalDateTime.now());
        users.save(gone);

        for (MockHttpServletRequestBuilder write : List.of(
                withJson(put("/api/pinned-stores/bulk"), "{\"stores\":[]}"),
                withJson(put("/api/pinned-places/bulk"), "{\"places\":[]}"),
                withJson(put("/api/favorite-stores/bulk"), "{\"stores\":[]}"),
                withJson(post("/api/watchlist"), "{\"productApiId\":\"1\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":10}"),
                withJson(patch("/api/users/me"), "{}"),
                withJson(post("/api/shopping-lists"), "{\"title\":\"Popis\"}"),
                withJson(put("/api/digital-cards/{id}", UUID.randomUUID()), """
                        {"cardName":"Moja","cardType":"loyalty","storeName":"Konzum","codeValue":"123","codeType":"ean_13","cardColor":"#D50000"}
                        """))) {
            mvc.perform(write.with(as(gone))).andExpect(status().isUnauthorized());
        }
    }

    // The 401 speaks about the caller; an admin naming a missing account is still signed in.
    @Test
    void anAdminNamingAnUnknownUserIs400() throws Exception {
        User admin = newAdmin();
        UUID unknown = UUID.randomUUID();

        mvc.perform(withJson(patch("/api/admin/users/{id}", unknown), "{\"accountType\":\"ENTERPRISE\"}").with(as(admin)))
                .andExpect(status().isBadRequest());
        mvc.perform(delete("/api/admin/users/{id}", unknown).with(as(admin))).andExpect(status().isBadRequest());
    }

    @Test
    void anAdminCannotDeleteThemselves() throws Exception {
        User admin = newAdmin();

        mvc.perform(delete("/api/admin/users/{id}", admin.getId()).with(as(admin))).andExpect(status().isBadRequest());
        assertThat(users.findById(admin.getId()).orElseThrow().getDeletedAt()).isNull();
    }
}
