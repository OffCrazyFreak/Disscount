package disscount.config;

import io.sentry.SentryOptions;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SentryReleaseConfigTest {

    private static SentryOptions configuredWith(String gitSha) {
        SentryOptions options = new SentryOptions();
        new SentryReleaseConfig().sentryReleaseFromGitSha(gitSha).configure(options);
        return options;
    }

    @Test
    void theCommitBecomesTheRelease() {
        assertThat(configuredWith("0123abcd").getRelease()).isEqualTo("0123abcd");
    }

    @Test
    void aBuildWithoutACommitLeavesTheReleaseUnset() {
        assertThat(configuredWith("").getRelease()).isNull();
    }
}
