package disscount.user.avatar;

import disscount.shared.photo.FakePhotoStore;
import disscount.shared.photo.TestImages;
import disscount.support.FullStackTest;
import disscount.user.AccountType;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.ResultActions;
import tools.jackson.databind.JsonNode;

import java.util.Arrays;
import java.util.UUID;

import static disscount.shared.photo.TestImages.contains;
import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AvatarEndpointsTest extends FullStackTest {

    @Autowired AvatarCleanupRepository cleanupQueue;
    @Autowired AvatarCleanupService cleanup;

    private FakePhotoStore files;
    private User user;

    @BeforeEach
    void setUp() {
        files = (FakePhotoStore) avatarStore;
        files.objects.clear();
        files.enabled = true;
        files.failDeletes = false;
        cleanupQueue.deleteAll();
        user = newUser("ana");
    }

    private ResultActions upload(User who, byte[] bytes) throws Exception {
        return mvc.perform(multipart(HttpMethod.PUT, "/api/users/me/avatar")
                .file(new MockMultipartFile("file", "avatar.jpg", "image/jpeg", bytes))
                .with(as(who)));
    }

    private String storedKey() {
        return users.findById(user.getId()).orElseThrow().getAvatarKey();
    }

    @Test
    void anUploadIsStoredCleanedUnderARandomNameAndReturnedAsAUrl() throws Exception {
        byte[] withGps = TestImages.jpegWithApp1(TestImages.jpeg(256, 256), "secret-gps");

        JsonNode profile = body(upload(user, withGps).andExpect(status().isOk()));

        String key = storedKey();
        assertThat(key).matches("avatars/" + user.getId() + "/[0-9a-f]{32}\\.jpg");
        assertThat(profile.get("image").asString()).isEqualTo("https://images.test/" + key);
        assertThat(contains(files.objects.get(key), "secret-gps")).isFalse();

        JsonNode me = body(mvc.perform(get("/api/users/me").with(as(user))).andExpect(status().isOk()));
        assertThat(me.get("image").asString()).isEqualTo("https://images.test/" + key);
    }

    @Test
    void aReplacedAvatarsOldFileIsDeleted() throws Exception {
        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());
        String first = storedKey();

        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());

        String second = storedKey();
        assertThat(second).isNotEqualTo(first);
        assertThat(files.objects).containsOnlyKeys(second);
        assertThat(cleanupQueue.findAll()).isEmpty();
    }

    @Test
    void aFormatOtherThanJpegOrWebpIsRefusedAndNothingIsStored() throws Exception {
        upload(user, TestImages.png(64, 64)).andExpect(status().isBadRequest());

        assertThat(files.objects).isEmpty();
        assertThat(storedKey()).isNull();
    }

    @Test
    void anAvatarWiderThanTheCapIsRefused() throws Exception {
        upload(user, TestImages.jpeg(AvatarService.MAX_SIDE + 1, 16)).andExpect(status().isBadRequest());

        assertThat(files.objects).isEmpty();
    }

    @Test
    void anAvatarLargerThanTheCapIsRefused() throws Exception {
        byte[] padded = Arrays.copyOf(TestImages.jpeg(64, 64), AvatarService.MAX_BYTES + 1);

        upload(user, padded).andExpect(status().isBadRequest());

        assertThat(files.objects).isEmpty();
    }

    @Test
    void theEleventhUploadInTenMinutesIsRefused() throws Exception {
        for (int i = 0; i < 10; i++) upload(user, TestImages.jpeg(16, 16)).andExpect(status().isOk());

        upload(user, TestImages.jpeg(16, 16)).andExpect(status().isTooManyRequests());
    }

    @Test
    void uploadsAnswer503WhileTheAvatarFolderIsMissing() throws Exception {
        files.enabled = false;

        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isServiceUnavailable());
    }

    @Test
    void removingTheAvatarDeletesTheFileAndClearsTheProviderPicture() throws Exception {
        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());

        JsonNode profile = body(mvc.perform(delete("/api/users/me/avatar").with(as(user))).andExpect(status().isOk()));

        assertThat(profile.get("image").isNull()).as(profile.toString()).isTrue();
        assertThat(files.objects).isEmpty();
        assertThat(storedKey()).isNull();
    }

    @Test
    void aProviderPictureIsShownUntilTheFirstUpload() throws Exception {
        User google = users.save(User.builder().id(UUID.randomUUID()).username("g-" + user.getId())
                .image("https://lh3.googleusercontent.com/a/picture").build());

        JsonNode me = body(mvc.perform(get("/api/users/me").with(as(google))).andExpect(status().isOk()));
        assertThat(me.get("image").asString()).isEqualTo("https://lh3.googleusercontent.com/a/picture");

        upload(google, TestImages.jpeg(64, 64)).andExpect(status().isOk());

        User stored = users.findById(google.getId()).orElseThrow();
        assertThat(stored.getImage()).isNull();
        assertThat(stored.getAvatarKey()).isNotNull();
    }

    @Test
    void erasingTheAccountDeletesEveryAvatarFile() throws Exception {
        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());
        // A file a crashed upload left behind, which no profile points at.
        files.objects.put(AvatarKeys.userPrefix(user.getId()) + "leftover.webp", new byte[]{1});

        mvc.perform(delete("/api/users/me")
                        .with(jwt().jwt(j -> j.subject(user.getId().toString()).claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());

        assertThat(files.objects).isEmpty();
        assertThat(cleanupQueue.findAll()).isEmpty();
    }

    @Test
    void anAdminDeletingTheUserDeletesTheAvatarFiles() throws Exception {
        User admin = newUser("admin", AccountType.ADMIN);
        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());

        mvc.perform(delete("/api/admin/users/{id}", user.getId()).with(as(admin))).andExpect(status().isOk());

        assertThat(files.objects).isEmpty();
    }

    @Test
    void anErasureWhileStorageIsDownIsRetriedUntilTheFilesAreGone() throws Exception {
        upload(user, TestImages.jpeg(64, 64)).andExpect(status().isOk());
        files.failDeletes = true;

        mvc.perform(delete("/api/users/me")
                        .with(jwt().jwt(j -> j.subject(user.getId().toString()).claim("purpose", "account-erasure"))))
                .andExpect(status().isOk());
        assertThat(cleanupQueue.findAll()).hasSize(1);

        files.failDeletes = false;
        cleanup.retryPending();

        assertThat(files.objects).isEmpty();
        assertThat(cleanupQueue.findAll()).isEmpty();
    }
}
