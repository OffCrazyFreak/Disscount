package disscount.user;

import disscount.digitalcard.DigitalCardRepository;
import disscount.preferences.favoritestore.FavoriteStoreRepository;
import disscount.storename.StoreNameUsageRepository;
import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.event.EventListener;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.MediaType;

import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** A feature that cannot erase its data must stop the whole erasure, or the account would look gone with data left. */
class AccountErasureRollbackTest extends FullStackTest {

    private static final Set<UUID> FAILING_FOR = ConcurrentHashMap.newKeySet();

    @TestConfiguration
    static class FailingListenerConfig {

        @Bean
        FailingListener failingListener() {
            return new FailingListener();
        }
    }

    static class FailingListener {

        // Last, so every real listener has already done its work when this one throws.
        @EventListener
        @Order(Ordered.LOWEST_PRECEDENCE)
        public void onAccountErased(AccountErased erased) {
            if (FAILING_FOR.contains(erased.userId())) {
                throw new IllegalStateException("listener failed");
            }
        }
    }

    @Autowired UserService userService;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired DigitalCardRepository cards;
    @Autowired FavoriteStoreRepository favoriteStores;
    @Autowired StoreNameUsageRepository storeNameUsages;

    @Test
    void aThrowingListenerRollsTheWholeErasureBack() throws Exception {
        User user = newUser("stays");
        mvc.perform(put("/api/digital-cards/{id}", UUID.randomUUID()).contentType(MediaType.APPLICATION_JSON).content("""
                {"cardName":"Moja","cardType":"loyalty","storeName":"Dućan %s","codeValue":"123","codeType":"ean_13","cardColor":"#D50000"}
                """.formatted(user.getId())).with(as(user))).andExpect(status().isOk());
        mvc.perform(put("/api/favorite-stores/bulk").contentType(MediaType.APPLICATION_JSON)
                .content("{\"stores\":[{\"storeKey\":\"konzum:1\"}]}").with(as(user))).andExpect(status().isOk());
        FAILING_FOR.add(user.getId());

        assertThatThrownBy(() -> userService.deleteAccount(user.getId()))
                .hasMessage("listener failed");

        User profile = users.findById(user.getId()).orElseThrow();
        assertThat(profile.getDeletedAt()).isNull();
        assertThat(profile.getUsername()).isEqualTo(user.getUsername());
        assertThat(erasureLedger.existsById(user.getId())).isFalse();
        assertThat(cards.findActiveByUserId(user.getId())).hasSize(1);
        assertThat(favoriteStores.findByUserId(user.getId())).hasSize(1);
        assertThat(storeNameUsages.findAll()).anyMatch(usage -> usage.getUserId().equals(user.getId()));
    }
}
