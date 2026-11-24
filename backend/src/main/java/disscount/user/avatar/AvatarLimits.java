package disscount.user.avatar;

import java.time.Clock;

import disscount.shared.FixedWindowLimiter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
class AvatarLimits {

    static final String UPLOADS = "avatarUploadLimiter";

    // Public like product photos, so the same cap; the settings modal sends one upload per save.
    @Bean(UPLOADS)
    FixedWindowLimiter avatarUploadLimiter() {
        return new FixedWindowLimiter(10, 10 * 60_000, "error.avatar.rateLimited", Clock.systemUTC());
    }
}
