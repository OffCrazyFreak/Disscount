package disscount.config;

import disscount.shared.Timestamps;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/** Spring's default provider reads the JVM's zone, so this one keeps audited rows on the Timestamps clock. */
@Configuration
@EnableJpaAuditing(dateTimeProviderRef = "utcDateTimeProvider")
class JpaConfig {

    @Bean
    DateTimeProvider utcDateTimeProvider() {
        return () -> Optional.of(Timestamps.nowUtc());
    }
}
