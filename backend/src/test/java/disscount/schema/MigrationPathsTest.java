package disscount.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/** The three ways a database reaches the latest version: new, from production's baseline and from dev's. */
@Testcontainers
class MigrationPathsTest {

    // The version dev and production run.
    @Container
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    private static final Path MIGRATIONS = Path.of("src/main/resources/db/migration");

    @Test
    void productionBaselinedAtOneEndsLikeANewDatabase() throws Exception {
        String production = createDatabase();
        runFile(production, "V1__tables_production_had.sql");

        flyway(production).baselineVersion("1").load().baseline();
        int applied = flyway(production).load().migrate().migrationsExecuted;

        assertThat(applied).isEqualTo(migrationCount() - 1);
        assertSameSchema(production, migratedFromNothing());
    }

    @Test
    void devBaselinedAtTwoEndsLikeANewDatabase() throws Exception {
        String dev = createDatabase();
        runFile(dev, "V1__tables_production_had.sql");
        runFile(dev, "V2__tables_added_since_august.sql");

        flyway(dev).baselineVersion("2").load().baseline();
        int applied = flyway(dev).load().migrate().migrationsExecuted;

        assertThat(applied).isEqualTo(migrationCount() - 2);
        assertSameSchema(dev, migratedFromNothing());
    }

    @Test
    void aDatabaseWithTablesButNoBaselineIsRefused() throws Exception {
        String unbaselined = createDatabase();
        runFile(unbaselined, "V1__tables_production_had.sql");

        assertThatThrownBy(() -> flyway(unbaselined).load().migrate())
                .hasMessageContaining("non-empty schema");
    }

    @Test
    void duplicateWatchesKeepTheNewestAndAnotherLiveOneIsRefused() throws Exception {
        String database = createDatabase();
        flyway(database).target("3").load().migrate();

        UUID user = UUID.randomUUID();
        UUID oldest = UUID.randomUUID();
        UUID newest = UUID.randomUUID();
        UUID middle = UUID.randomUUID();
        UUID alreadyDeleted = UUID.randomUUID();
        UUID otherType = UUID.randomUUID();

        try (Connection connection = connect(database); Statement statement = connection.createStatement()) {
            statement.execute("insert into app_user (id, account_type, created_at) values ('%s', 'CONSUMER', now())".formatted(user));
            insertWatch(statement, oldest, user, "PERCENTAGE", 5, "2026-01-01", null);
            insertWatch(statement, newest, user, "PERCENTAGE", 15, "2026-03-01", null);
            insertWatch(statement, middle, user, "PERCENTAGE", 10, "2026-02-01", null);
            insertWatch(statement, alreadyDeleted, user, "PERCENTAGE", 20, "2026-04-01", "2026-04-02");
            insertWatch(statement, otherType, user, "ABSOLUTE", 1, "2026-01-01", null);
        }

        flyway(database).load().migrate();

        try (Connection connection = connect(database); Statement statement = connection.createStatement()) {
            assertThat(liveIds(statement)).containsExactlyInAnyOrder(newest.toString(), otherType.toString());

            assertThatThrownBy(() -> insertWatch(statement, UUID.randomUUID(), user, "PERCENTAGE", 30, "2026-05-01", null))
                    .hasMessageContaining("ux_watchlist_item_user_product_type");

            insertWatch(statement, UUID.randomUUID(), user, "PERCENTAGE", 30, "2026-05-01", "2026-05-02");
        }
    }

    private static void insertWatch(Statement statement, UUID id, UUID user, String type, double threshold,
            String updatedOn, String deletedOn) throws SQLException {
        statement.execute("""
                insert into watchlist_item (id, user_id, product_api_id, watch_type, threshold_value, created_at, updated_at, deleted_at)
                values ('%s', '%s', '3850104', '%s', %s, '2026-01-01', '%s', %s)
                """.formatted(id, user, type, threshold, updatedOn, deletedOn == null ? "null" : "'" + deletedOn + "'"));
    }

    private static List<String> liveIds(Statement statement) throws SQLException {
        List<String> ids = new ArrayList<>();

        try (ResultSet rows = statement.executeQuery("select id from watchlist_item where deleted_at is null")) {
            while (rows.next()) {
                ids.add(rows.getString(1));
            }
        }

        return ids;
    }

    private static String migratedFromNothing() throws SQLException {
        String database = createDatabase();
        flyway(database).load().migrate();

        return database;
    }

    private static void assertSameSchema(String database, String reference) throws SQLException {
        try (Connection actual = connect(database); Connection expected = connect(reference)) {
            Catalog actualCatalog = Catalog.read(actual, Catalog.tables(actual));
            Catalog expectedCatalog = Catalog.read(expected, Catalog.tables(expected));

            assertThat(new HashSet<>(actualCatalog.columns())).isEqualTo(new HashSet<>(expectedCatalog.columns()));
            assertThat(new HashSet<>(actualCatalog.checks())).isEqualTo(new HashSet<>(expectedCatalog.checks()));
            assertThat(new HashSet<>(actualCatalog.keys())).isEqualTo(new HashSet<>(expectedCatalog.keys()));
            assertThat(new HashSet<>(actualCatalog.indexes())).isEqualTo(new HashSet<>(expectedCatalog.indexes()));
        }
    }

    private static FluentConfiguration flyway(String database) {
        return Flyway.configure()
                .dataSource(url(database), POSTGRES.getUsername(), POSTGRES.getPassword())
                .locations("filesystem:" + MIGRATIONS);
    }

    private static long migrationCount() throws IOException {
        try (Stream<Path> files = Files.list(MIGRATIONS)) {
            return files.filter(file -> file.getFileName().toString().matches("V\\d+__.*\\.sql")).count();
        }
    }

    private static void runFile(String database, String file) throws SQLException, IOException {
        try (Connection connection = connect(database); Statement statement = connection.createStatement()) {
            statement.execute(Files.readString(MIGRATIONS.resolve(file)));
        }
    }

    private static String createDatabase() throws SQLException {
        String name = "db_" + UUID.randomUUID().toString().replace("-", "");

        try (Connection admin = POSTGRES.createConnection(""); Statement statement = admin.createStatement()) {
            statement.execute("create database " + name);
        }

        return name;
    }

    private static Connection connect(String database) throws SQLException {
        return DriverManager.getConnection(url(database), POSTGRES.getUsername(), POSTGRES.getPassword());
    }

    private static String url(String database) {
        return POSTGRES.getJdbcUrl().replace("/" + POSTGRES.getDatabaseName(), "/" + database);
    }
}
