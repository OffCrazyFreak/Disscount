package disscount.preferences.favoritestore;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

import disscount.shared.BadRequestException;
import disscount.shared.UnauthorizedException;
import disscount.user.ActiveUsers;
import disscount.user.AuthIdentityDao;
import disscount.user.User;
import disscount.user.UserRepository;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DataJpaTest(showSql = false)
@Import({ActiveUsers.class, AuthIdentityDao.class, FavoriteStoreService.class})
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
                .extracting(FavoriteStoreDto::storeKey)
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
                .isInstanceOf(UnauthorizedException.class)
                .hasMessage("error.user.notFound");
    }

    private static BulkFavoriteStoreRequest request(String... keys) {
        return new BulkFavoriteStoreRequest(List.of(keys).stream().map(FavoriteStoreRequest::new).toList());
    }
}
