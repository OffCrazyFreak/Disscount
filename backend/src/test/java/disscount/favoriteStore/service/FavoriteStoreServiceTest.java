package disscount.favoriteStore.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;

import disscount.exceptions.BadRequestException;
import disscount.favoriteStore.dao.FavoriteStoreRepository;
import disscount.favoriteStore.dto.BulkFavoriteStoreRequest;
import disscount.favoriteStore.dto.FavoriteStoreDto;
import disscount.favoriteStore.dto.FavoriteStoreRequest;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Import(FavoriteStoreService.class)
class FavoriteStoreServiceTest {

    @Autowired FavoriteStoreService service;
    @Autowired FavoriteStoreRepository favoriteStores;
    @Autowired UserRepository users;

    User user;

    @BeforeEach
    void setUp() {
        user = users.save(User.builder().id(UUID.randomUUID()).username("marko").build());
    }

    @Test
    void savingReplacesTheWholeList() {
        service.updateFavoriteStores(user.getId(), request("konzum:1", "lidl:2"));
        service.updateFavoriteStores(user.getId(), request("spar:3"));

        assertThat(service.getUserFavoriteStores(user.getId()))
                .extracting(FavoriteStoreDto::getStoreKey)
                .containsExactly("spar:3");
    }

    @Test
    void duplicateStoresAreRejectedAndTheOldListKept() {
        service.updateFavoriteStores(user.getId(), request("konzum:1"));

        assertThatThrownBy(() -> service.updateFavoriteStores(user.getId(), request("lidl:2", "lidl:2")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.favoriteStore.duplicate");
        assertThat(favoriteStores.findByUserId(user.getId())).hasSize(1);
    }

    @Test
    void aDeletedAccountCannotSaveFavorites() {
        user.setDeletedAt(java.time.LocalDateTime.of(2026, 1, 1, 0, 0));
        users.save(user);

        assertThatThrownBy(() -> service.updateFavoriteStores(user.getId(), request("konzum:1")))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("error.user.notFound");
    }

    private static BulkFavoriteStoreRequest request(String... keys) {
        BulkFavoriteStoreRequest request = new BulkFavoriteStoreRequest();
        request.setStores(List.of(keys).stream().map(key -> {
            FavoriteStoreRequest store = new FavoriteStoreRequest();
            store.setStoreKey(key);
            return store;
        }).toList());
        return request;
    }
}
