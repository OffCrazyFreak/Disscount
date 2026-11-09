package disscount;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.photo.TestImages;
import disscount.favoriteStore.dao.FavoriteStoreRepository;
import disscount.pinnedStore.dao.PinnedStoreRepository;
import disscount.shoppingList.dao.ShoppingListRepository;
import disscount.productImage.dao.ProductImageRepository;
import disscount.productImage.domain.ImageSource;
import disscount.storage.FakePhotoStore;
import disscount.storeName.dao.StoreNameSuggestionRepository;
import disscount.storeName.dao.StoreNameUsageRepository;
import disscount.support.FullStackTest;
import disscount.user.dao.ErasureLedgerRepository;
import disscount.user.domain.User;
import disscount.watchlistItem.dao.WatchlistItemRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
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
        mvc.perform(withJson(post("/api/shopping-lists"), "{\"title\":\"Tjedna kupnja\"}").with(as(user)))
                .andExpect(status().isOk());
        mvc.perform(withJson(post("/api/watchlist"), "{\"productApiId\":\"3850123456789\",\"watchType\":\"PERCENTAGE\",\"thresholdValue\":10}")
                .with(as(user))).andExpect(status().isOk());
    }

    private int useCountOf(String store) {
        return storeNames.findAll().stream().filter(s -> s.getName().equals(store)).findFirst().orElseThrow().getUseCount();
    }

    private void assertErased(User leaving) {
        UUID id = leaving.getId();
        User profile = users.findById(id).orElseThrow();
        assertThat(profile.getDeletedAt()).isNotNull();
        assertThat(profile.getUsername()).isNull();
        assertThat(profile.getImage()).isNull();
        assertThat(erasureLedger.findById(id)).isPresent();

        assertThat(cards.findAll()).noneMatch(card -> card.getUser().getId().equals(id));
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

        // Business data stays, attached to the anonymised profile.
        assertThat(shoppingLists.findActiveByOwner(profile)).hasSize(1);
        assertThat(watchlist.findByUserId(id)).hasSize(1);
        assertThat(pinnedStores.findByUserId(id)).hasSize(1);
    }

    @Test
    void theErasureTokenRemovesPersonalDataAndKeepsBusinessData() throws Exception {
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
        assertThat(shoppingLists.findActiveByOwner(staying)).hasSize(1);
        assertThat(watchlist.findByUserId(staying.getId())).hasSize(1);
        assertThat(pinnedStores.findByUserId(staying.getId())).hasSize(1);
    }

    // better-auth calls this before deleting any identity, including one that never made a request here.
    @Test
    void anIdentityWithoutAProfileIsErasedAndTombstoned() throws Exception {
        UUID neverSeen = UUID.randomUUID();

        mvc.perform(delete("/api/users/me").with(jwt().jwt(j -> j.subject(neverSeen.toString()).claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());

        assertThat(users.findById(neverSeen)).isEmpty();
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
        assertThat(users.findById(leaving.getId()).orElseThrow().getDeletedAt()).isNotNull();
    }

    @Test
    void anAdminDeleteRemovesTheIdentityAndRunsTheSameErasure() throws Exception {
        User admin = newAdmin();
        User leaving = newUser("leaving");
        giveEverything(leaving, "Dućan " + UUID.randomUUID().toString().substring(0, 8));

        mvc.perform(delete("/api/admin/users/{id}", leaving.getId()).with(as(admin))).andExpect(status().isOk());

        verify(authIdentityDao).deleteById(leaving.getId());
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
