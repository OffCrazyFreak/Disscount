package disscount.support;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Runs the test on PostgreSQL migrated by Flyway, with Hibernate only validating, the way dev and production run.
 * Every class with it shares one container and, on the same base class, one Spring context.
 */
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@ImportTestcontainers(MigratedPostgres.Database.class)
@TestPropertySource(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
        // The DDL Hibernate would create, which SchemaDriftTest compares with the migrated tables.
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.action=create",
        "spring.jpa.properties.jakarta.persistence.schema-generation.scripts.create-target=" + MigratedPostgres.HIBERNATE_DDL,
        "spring.jpa.properties.hibernate.hbm2ddl.schema-generation.script.append=false",
        "spring.jpa.properties.hibernate.hbm2ddl.delimiter=;"
})
public @interface MigratedPostgres {

    String HIBERNATE_DDL = "target/hibernate-create.sql";

    final class Database {

        // The version dev and production run.
        @ServiceConnection
        public static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

        private Database() {
        }
    }
}
