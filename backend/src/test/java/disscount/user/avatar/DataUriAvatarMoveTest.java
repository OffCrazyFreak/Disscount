package disscount.user.avatar;

import disscount.shared.photo.FakePhotoStore;
import disscount.shared.photo.TestImages;
import disscount.support.FullStackTest;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.Base64;
import java.util.UUID;

import static disscount.shared.photo.TestImages.contains;
import static org.assertj.core.api.Assertions.assertThat;

class DataUriAvatarMoveTest extends FullStackTest {

    @Autowired DataUriAvatarMove move;

    private FakePhotoStore files;

    @BeforeEach
    void setUp() {
        files = (FakePhotoStore) avatarStore;
        files.objects.clear();
        files.enabled = true;
        users.deleteAll();
    }

    private User withImage(String image) {
        UUID id = UUID.randomUUID();
        return users.save(User.builder().id(id).username("u-" + id).image(image).build());
    }

    private static String dataUri(byte[] bytes) {
        return "data:image/jpeg;base64," + Base64.getEncoder().encodeToString(bytes);
    }

    private User reload(User user) {
        return users.findById(user.getId()).orElseThrow();
    }

    @Test
    void aDatabaseAvatarBecomesACleanedFileAndTheColumnIsCleared() {
        User user = withImage(dataUri(TestImages.jpegWithApp1(TestImages.jpeg(256, 256), "secret-gps")));

        assertThat(move.moveBatch()).isEqualTo(1);

        User moved = reload(user);
        assertThat(moved.getImage()).isNull();
        assertThat(moved.getAvatarKey()).startsWith(AvatarKeys.userPrefix(user.getId()));
        assertThat(contains(files.objects.get(moved.getAvatarKey()), "secret-gps")).isFalse();
    }

    @Test
    void runningAgainMovesNothingAndKeepsTheFile() {
        withImage(dataUri(TestImages.jpeg(64, 64)));
        move.moveBatch();

        assertThat(move.moveBatch()).isZero();
        assertThat(files.objects).hasSize(1);
    }

    @Test
    void anUnreadableDatabaseAvatarIsDroppedSoItIsNotRetriedForever() {
        User broken = withImage("data:image/webp;base64,not-base64!");

        move.moveBatch();

        assertThat(reload(broken).getImage()).isNull();
        assertThat(reload(broken).getAvatarKey()).isNull();
        assertThat(files.objects).isEmpty();
    }

    @Test
    void aProviderPictureUrlIsLeftAlone() {
        User google = withImage("https://lh3.googleusercontent.com/a/picture");

        assertThat(move.moveBatch()).isZero();

        assertThat(reload(google).getImage()).isEqualTo("https://lh3.googleusercontent.com/a/picture");
    }

    @Test
    void nothingMovesWhileTheAvatarFolderIsMissing() {
        User user = withImage(dataUri(TestImages.jpeg(64, 64)));
        files.enabled = false;

        assertThat(move.moveBatch()).isZero();

        assertThat(reload(user).getImage()).startsWith("data:");
    }
}
