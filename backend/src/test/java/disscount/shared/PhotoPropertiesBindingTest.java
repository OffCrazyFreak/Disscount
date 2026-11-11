package disscount.shared;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;

class PhotoPropertiesBindingTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withUserConfiguration(PhotoStoreConfig.class);

    @Test
    void eachKeyBindsToItsOwnField() {
        runner.withPropertyValues(
                        "photos.private-dir=/srv/private",
                        "photos.public-dir=/srv/public",
                        "photos.public-url=https://images.test")
                .run(context -> assertThat(context.getBean(PhotoProperties.class))
                        .isEqualTo(new PhotoProperties("/srv/private", "/srv/public", "https://images.test")));
    }

    @Test
    void absentKeysAreBlankAndSwitchEveryStoreOff() {
        runner.run(context -> {
            assertThat(context.getBean(PhotoProperties.class)).isEqualTo(new PhotoProperties("", "", ""));
            assertThat(context.getBeansOfType(PhotoStore.class).values())
                    .hasSize(3)
                    .allSatisfy(store -> assertThat(store).isInstanceOf(DisabledPhotoStore.class));
        });
    }

    @Test
    void blankKeysSwitchEveryStoreOff() {
        runner.withPropertyValues("photos.private-dir=", "photos.public-dir=", "photos.public-url=")
                .run(context -> assertThat(context.getBeansOfType(PhotoStore.class).values())
                        .allSatisfy(store -> assertThat(store).isInstanceOf(DisabledPhotoStore.class)));
    }

    @Test
    void setFoldersReachTheStores(@TempDir Path directory) {
        runner.withPropertyValues(
                        "photos.private-dir=" + directory,
                        "photos.public-dir=" + directory,
                        "photos.public-url=https://images.test/")
                .run(context -> {
                    assertThat(context.getBeansOfType(PhotoStore.class).values())
                            .allSatisfy(store -> assertThat(store).isInstanceOf(FilesystemPhotoStore.class));
                    assertThat(context.getBean(PhotoStoreConfig.PRODUCT_PHOTOS, PhotoStore.class)
                            .publicUrl("products/1/a.webp"))
                            .isEqualTo("https://images.test/products/1/a.webp");
                });
    }
}
