package disscount.user.service;

import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.service.DigitalCardService;
import disscount.exceptions.BadRequestException;
import disscount.favoriteStore.service.FavoriteStoreService;
import disscount.user.avatar.AvatarSanitizer;
import disscount.productImage.service.ProductImageErasure;
import disscount.user.dao.AuthIdentityDao;
import disscount.user.dao.ErasureLedgerRepository;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.dto.UserRequest;
import org.junit.jupiter.api.Test;

import java.util.Base64;
import java.util.UUID;

import static disscount.digitalCard.photo.TestImages.contains;
import static disscount.digitalCard.photo.TestImages.jpeg;
import static disscount.digitalCard.photo.TestImages.jpegWithApp1;
import static disscount.digitalCard.photo.TestImages.png;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

class UserServiceAvatarTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserService userService = new UserService(userRepository, mock(AuthIdentityDao.class),
            mock(UserProfileCreator.class), mock(DigitalCardService.class), mock(FavoriteStoreService.class), mock(ProductImageErasure.class),
            mock(ErasureLedgerRepository.class), new AvatarSanitizer(new PhotoValidator()));

    private final User user = User.builder().id(UUID.randomUUID()).username("ana").image("data:image/webp;base64,old").build();

    private UserRequest withImage(String image) {
        when(userRepository.requireActive(user.getId())).thenReturn(user);
        when(userRepository.save(any(User.class))).thenAnswer(call -> call.getArgument(0));
        UserRequest request = new UserRequest();
        request.setImage(image);
        return request;
    }

    private static String dataUri(String type, byte[] bytes) {
        return "data:" + type + ";base64," + Base64.getEncoder().encodeToString(bytes);
    }

    @Test
    void storesTheSanitisedAvatarWithoutItsMetadata() {
        UserRequest request = withImage(dataUri("image/jpeg", jpegWithApp1(jpeg(64, 64), "secret-gps")));

        userService.updateProfile(user.getId(), request);

        String stored = user.getImage();
        assertThat(stored).startsWith("data:image/jpeg;base64,");
        byte[] bytes = Base64.getDecoder().decode(stored.substring(stored.indexOf(',') + 1));
        assertThat(contains(bytes, "secret-gps")).isFalse();
    }

    @Test
    void refusesAPngAvatarAndKeepsTheOldOne() {
        UserRequest request = withImage(dataUri("image/png", png(64, 64)));

        assertThatThrownBy(() -> userService.updateProfile(user.getId(), request))
                .isInstanceOf(BadRequestException.class);
        assertThat(user.getImage()).isEqualTo("data:image/webp;base64,old");
    }

    @Test
    void anEmptyImageClearsTheAvatar() {
        userService.updateProfile(user.getId(), withImage(""));

        assertThat(user.getImage()).isNull();
    }
}
