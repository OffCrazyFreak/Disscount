package disscount.config;

import io.sentry.Sentry;
import io.sentry.SentryOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SentryReleaseConfig {

    // Not a sentry.release placeholder: images built without a commit SHA would send an empty release.
    @Bean
    public Sentry.OptionsConfiguration<SentryOptions> sentryReleaseFromGitSha(
            @Value("${GIT_SHA:}") String gitSha) {
        return options -> {
            if (!gitSha.isBlank()) options.setRelease(gitSha);
        };
    }
}
