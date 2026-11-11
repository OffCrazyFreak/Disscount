package disscount.user.erasure;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;

class ErasureReplayPropertiesBindingTest {

    private static final String PROFILE = "spring.profiles.active=" + ErasureReplayRunner.PROFILE;
    private static final String MARKERS = "erasure-replay.markers=";
    private static final String KEY_FILE = "erasure-replay.key-file=";

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withBean(ErasureReplay.class, () -> mock(ErasureReplay.class))
            .withUserConfiguration(ErasureReplayRunner.class);

    @Test
    void outsideItsProfileNothingIsBoundOrRequired() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context).doesNotHaveBean(ErasureReplayRunner.class);
            assertThat(context).doesNotHaveBean(ErasureReplayProperties.class);
        });
    }

    @Test
    void bothPathsBindAndAllowEmptyIsOffByDefault() {
        runner.withPropertyValues(PROFILE, MARKERS + "/restore/_erasures/v1", KEY_FILE + "/restore/hmac.key")
                .run(context -> assertThat(context.getBean(ErasureReplayProperties.class)).isEqualTo(
                        new ErasureReplayProperties(Path.of("/restore/_erasures/v1"), Path.of("/restore/hmac.key"), false)));
    }

    @Test
    void allowEmptyBindsBothWays() {
        runner.withPropertyValues(PROFILE, MARKERS + "/m", KEY_FILE + "/k", "erasure-replay.allow-empty=true")
                .run(context -> assertThat(context.getBean(ErasureReplayProperties.class).allowEmpty()).isTrue());

        runner.withPropertyValues(PROFILE, MARKERS + "/m", KEY_FILE + "/k", "erasure-replay.allow-empty=false")
                .run(context -> assertThat(context.getBean(ErasureReplayProperties.class).allowEmpty()).isFalse());
    }

    @Test
    void aMissingPathStopsStartup() {
        runner.withPropertyValues(PROFILE, KEY_FILE + "/k").run(context -> assertThat(context).hasFailed());
        runner.withPropertyValues(PROFILE, MARKERS + "/m").run(context -> assertThat(context).hasFailed());
    }

    @Test
    void aBlankPathStopsStartup() {
        runner.withPropertyValues(PROFILE, MARKERS, KEY_FILE + "/k").run(context -> assertThat(context).hasFailed());
        runner.withPropertyValues(PROFILE, MARKERS + "/m", KEY_FILE).run(context -> assertThat(context).hasFailed());
    }
}
