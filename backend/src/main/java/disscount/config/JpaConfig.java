package disscount.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * Enables JPA auditing so @CreatedDate / @LastModifiedDate on BaseEntity get populated.
 */
@Configuration
@EnableJpaAuditing
public class JpaConfig {
}
