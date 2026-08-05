package disscount.config;

import disscount.util.Timestamps;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.auditing.DateTimeProvider;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;

/**
 * Enables JPA auditing so @CreatedDate / @LastModifiedDate on BaseEntity get populated.
 *
 * <p>Spring's default provider reads the JVM's zone, which would stamp audited rows in a
 * different zone from every hand-stamped column. The explicit provider puts all of them
 * on the one clock {@link Timestamps} defines.
 */
@Configuration
@EnableJpaAuditing(dateTimeProviderRef = "utcDateTimeProvider")
public class JpaConfig {

    @Bean
    DateTimeProvider utcDateTimeProvider() {
        return () -> Optional.of(Timestamps.nowUtc());
    }
}
