package disscount.config;

import disscount.util.Timestamps;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/** Spring's default provider reads the JVM's zone, so this explicit one puts audited rows on the one clock Timestamps defines. */
@Configuration
@EnableJpaAuditing(dateTimeProviderRef = "utcDateTimeProvider")
public class JpaConfig {

    @Bean
    DateTimeProvider utcDateTimeProvider() {
        return () -> Optional.of(Timestamps.nowUtc());
    }
}
