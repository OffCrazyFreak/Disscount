package disscount.user;

import disscount.shared.BadRequestException;
import disscount.shared.PhotoValidator;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Base64;
import java.util.UUID;

import static disscount.shared.TestImages.contains;
import static disscount.shared.TestImages.jpeg;
import static disscount.shared.TestImages.jpegWithApp1;
import static disscount.shared.TestImages.png;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

class UserServiceAvatarTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserService userService = new UserService(userRepository, mock(AuthIdentityDao.class),
            mock(UserProfileCreator.class), mock(ActiveUsers.class), mock(ApplicationEventPublisher.class),
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
