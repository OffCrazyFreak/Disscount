package disscount.support;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import org.flywaydb.core.Flyway;
import org.springframework.boot.testcontainers.context.ImportTestcontainers;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Runs the test on PostgreSQL migrated by Flyway, with Hibernate only validating, the way dev and production run:
 * Flyway as the migrator login and the app as the backend login, with the grants of db/database-roles.sql.
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
        public static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

        private static boolean prepared;

        private Database() {
        }

        @DynamicPropertySource
        static void logins(DynamicPropertyRegistry registry) throws Exception {
            prepareOnce();

            registry.add("spring.datasource.driver-class-name", () -> "org.postgresql.Driver");
            registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
            registry.add("spring.datasource.username", () -> DatabaseRoles.BACKEND);
            registry.add("spring.datasource.password", () -> DatabaseRoles.password(DatabaseRoles.BACKEND));
            registry.add("spring.flyway.user", () -> DatabaseRoles.MIGRATOR);
            registry.add("spring.flyway.password", () -> DatabaseRoles.password(DatabaseRoles.MIGRATOR));
        }

        // A new database the way a new server gets one: roles first, migrations as the migrator, then the roles
        // again, because tables a migration made in public and moved into app carry no grants yet.
        private static synchronized void prepareOnce() throws Exception {
            if (prepared) {
                return;
            }

            POSTGRES.start();
            DatabaseRoles.apply(POSTGRES, POSTGRES.getDatabaseName());

            Flyway.configure()
                    .dataSource(POSTGRES.getJdbcUrl(), DatabaseRoles.MIGRATOR, DatabaseRoles.password(DatabaseRoles.MIGRATOR))
                    .locations("filesystem:src/main/resources/db/migration")
                    .load()
                    .migrate();

            DatabaseRoles.apply(POSTGRES, POSTGRES.getDatabaseName());
            prepared = true;
        }
    }
}
