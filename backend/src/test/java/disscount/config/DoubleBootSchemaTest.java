package disscount.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import disscount.Application;

/** ddl-auto=update alters tables PostgreSQL reads back differently (#397), unseen on H2, so a second start must not. */
@Testcontainers
class DoubleBootSchemaTest {

    // The version production runs.
    @Container
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    private static final String RECORD_DDL = """
            create table recorded_ddl (command text, object text);
            create function record_ddl() returns event_trigger language plpgsql as $$
            begin
              insert into recorded_ddl
                select command_tag, object_identity from pg_event_trigger_ddl_commands();
            end $$;
            create event trigger record_ddl on ddl_command_end execute function record_ddl();
            """;

    @Test
    void secondStartChangesNoSchema() throws SQLException {
        startAndStopApp();

        try (Connection connection = POSTGRES.createConnection("");
                Statement statement = connection.createStatement()) {
            statement.execute(RECORD_DDL);
        }

        startAndStopApp();

        assertThat(recordedDdl()).isEmpty();
    }

    // Arguments, because they outrank a developer's backend/.env, which must never point this at a real database.
    private void startAndStopApp() {
        new SpringApplicationBuilder(Application.class)
                .run(
                        "--spring.config.location=file:src/main/resources/application.properties",
                        "--SPRING_DATASOURCE_URL=" + POSTGRES.getJdbcUrl(),
                        "--SPRING_DATASOURCE_USERNAME=" + POSTGRES.getUsername(),
                        "--SPRING_DATASOURCE_PASSWORD=" + POSTGRES.getPassword(),
                        "--BETTER_AUTH_JWKS_URI=http://localhost:3000/api/auth/jwks",
                        "--BETTER_AUTH_ISSUER=http://localhost:3000",
                        "--SENTRY_DSN=",
                        "--PHOTO_DIR=",
                        "--PUBLIC_PHOTO_DIR=",
                        "--R2_PUBLIC_URL=",
                        "--product-images.jobs.enabled=false",
                        "--server.port=0")
                .close();
    }

    private List<String> recordedDdl() throws SQLException {
        List<String> commands = new ArrayList<>();

        try (Connection connection = POSTGRES.createConnection("");
                Statement statement = connection.createStatement();
                ResultSet rows = statement.executeQuery("select command, object from recorded_ddl")) {
            while (rows.next()) {
                commands.add(rows.getString("command") + " " + rows.getString("object"));
            }
        }

        return commands;
    }
}
