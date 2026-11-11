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
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

import disscount.support.DatabaseRoles;

/**
 * The grants of db/database-roles.sql on a database with both the Flyway and the drizzle tables: each runtime
 * login reaches only its own schemas plus the few columns it reads across, and the migrator owns everything.
 */
@Testcontainers
class DatabaseRolesTest {

    @Container
    private static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17-alpine");

    private static final Path FLYWAY_MIGRATIONS = Path.of("src/main/resources/db/migration");
    private static final Path DRIZZLE_MIGRATIONS = Path.of("../frontend/drizzle");

    private static final String DATABASE = "roles";

    @BeforeAll
    static void migrateANewDatabaseTheWayANewServerDoes() throws Exception {
        try (Connection owner = POSTGRES.createConnection(""); Statement statement = owner.createStatement()) {
            statement.execute("create database " + DATABASE);
        }

        DatabaseRoles.apply(POSTGRES, DATABASE);

        Flyway.configure()
                .dataSource(DatabaseRoles.url(POSTGRES, DATABASE), DatabaseRoles.MIGRATOR,
                        DatabaseRoles.password(DatabaseRoles.MIGRATOR))
                .locations("filesystem:" + FLYWAY_MIGRATIONS)
                .load()
                .migrate();

        try (Connection migrator = DatabaseRoles.connect(POSTGRES, DATABASE, DatabaseRoles.MIGRATOR);
                Statement statement = migrator.createStatement()) {
            for (Path file : drizzleMigrations()) {
                statement.execute(Files.readString(file));
            }
        }

        DatabaseRoles.apply(POSTGRES, DATABASE);
    }

    @Test
    void theBackendWritesItsOwnTablesAndOnlyAppendsToTheAdminAudit() throws SQLException {
        allowed(DatabaseRoles.BACKEND, "insert into app.app_user (id, account_type, created_at) values (gen_random_uuid(), 'CONSUMER', now())");
        allowed(DatabaseRoles.BACKEND, "update app.app_user set username = null where false");
        allowed(DatabaseRoles.BACKEND, "delete from app.wallet_card where false");
        allowed(DatabaseRoles.BACKEND, "update app.shopping_list set link_access = null where false");
        allowed(DatabaseRoles.BACKEND, "update app.contact_message set email = null, full_name = null where false");
        allowed(DatabaseRoles.BACKEND, "insert into app.admin_audit values (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 'DELETE_USER', now())");
        allowed(DatabaseRoles.BACKEND, "select count(*) from app.admin_audit");

        refused(DatabaseRoles.BACKEND, "update app.admin_audit set action = 'DELETE_USER'");
        refused(DatabaseRoles.BACKEND, "delete from app.admin_audit");
        refused(DatabaseRoles.BACKEND, "truncate app.admin_audit");
        refused(DatabaseRoles.BACKEND, "create table app.not_yours (id int)");
    }

    @Test
    void theBackendReadsOnlyTheLoginColumnsItShowsAndNeverDeletesALogin() throws SQLException {
        allowed(DatabaseRoles.BACKEND, """
                select u.id, u.email, greatest(u.last_login_at, max(s.created_at)), max(s.updated_at)
                from auth."user" u left join auth.session s on s.user_id = u.id group by u.id, u.email, u.last_login_at
                """);
        allowed(DatabaseRoles.BACKEND, "select email from auth.\"user\" where id = gen_random_uuid()");
        allowed(DatabaseRoles.BACKEND, "delete from auth.session where expires_at < now() - interval '1 day'");
        allowed(DatabaseRoles.BACKEND, "update auth.session set ip_address = null where created_at < now() and ip_address is not null");

        refused(DatabaseRoles.BACKEND, "delete from auth.\"user\"");
        refused(DatabaseRoles.BACKEND, "update auth.\"user\" set email = email");
        refused(DatabaseRoles.BACKEND, "select name from auth.\"user\"");
        refused(DatabaseRoles.BACKEND, "select token from auth.session");
        refused(DatabaseRoles.BACKEND, "select password from auth.account");
        refused(DatabaseRoles.BACKEND, "select private_key from auth.jwks");
        refused(DatabaseRoles.BACKEND, "select * from auth.verification");
        refused(DatabaseRoles.BACKEND, "select * from web.store_location");
    }

    @Test
    void nextJsWritesTheLoginTablesAndOnlyAsksTheLedgerWhetherAnIdIsErased() throws SQLException {
        UUID login = UUID.randomUUID();

        allowed(DatabaseRoles.WEB, "insert into auth.\"user\" (id, name, email) values ('%s', 'n', '%s@example.com')".formatted(login, login));
        allowed(DatabaseRoles.WEB, "select private_key from auth.jwks");
        allowed(DatabaseRoles.WEB, "select count(*) from web.store_location_sync");
        allowed(DatabaseRoles.WEB, """
                delete from auth."user" where id = '%s'
                and exists (select 1 from app.erasure_ledger where erasure_ledger.user_id = "user".id)
                """.formatted(login));

        refused(DatabaseRoles.WEB, "select erased_at from app.erasure_ledger");
        refused(DatabaseRoles.WEB, "insert into app.erasure_ledger (user_id, erased_at, scope) values (gen_random_uuid(), now(), 'account')");
        refused(DatabaseRoles.WEB, "select * from app.app_user");
        refused(DatabaseRoles.WEB, "select * from app.admin_audit");
    }

    // The erasure replay runs as the migrator, the one login besides Next.js that may delete a login.
    @Test
    void theMigratorOwnsEveryTableAndANewTableIsGrantedWithoutAnotherRun() throws SQLException {
        allowed(DatabaseRoles.MIGRATOR, "delete from auth.\"user\" where false");
        allowed(DatabaseRoles.MIGRATOR, "create table app.added_later (id int)");
        allowed(DatabaseRoles.BACKEND, "insert into app.added_later values (1)");
        refused(DatabaseRoles.WEB, "select * from app.added_later");
        allowed(DatabaseRoles.MIGRATOR, "drop table app.added_later");

        assertThat(single("""
                select count(*) from pg_tables
                where schemaname in ('app', 'auth', 'web', 'drizzle') and tableowner <> '%s'
                """.formatted(DatabaseRoles.MIGRATOR))).isEqualTo("0");
    }

    @Test
    void aSecondRunChangesNoGrant() throws Exception {
        String before = grants();

        DatabaseRoles.apply(POSTGRES, DATABASE);

        assertThat(grants()).isEqualTo(before);
    }

    // Grants per schema would silently miss every table still in public, so the script refuses to run that early.
    @Test
    void theScriptRefusesADatabaseWhoseTablesAreStillInPublic() throws Exception {
        String unmoved = "unmoved";

        try (Connection owner = POSTGRES.createConnection(""); Statement statement = owner.createStatement()) {
            statement.execute("create database " + unmoved);
        }

        try (Connection owner = ownerOf(unmoved); Statement statement = owner.createStatement()) {
            statement.execute(Files.readString(FLYWAY_MIGRATIONS.resolve("V1__tables_production_had.sql")));
        }

        assertThatThrownBy(() -> DatabaseRoles.apply(POSTGRES, unmoved))
                .hasMessageContaining("the tables are still in public");
    }

    private static List<Path> drizzleMigrations() throws IOException {
        try (Stream<Path> files = Files.list(DRIZZLE_MIGRATIONS)) {
            return files.filter(file -> file.getFileName().toString().matches("\\d{4}_.*\\.sql")).sorted().toList();
        }
    }

    private static void allowed(String role, String sql) throws SQLException {
        try (Connection connection = DatabaseRoles.connect(POSTGRES, DATABASE, role);
                Statement statement = connection.createStatement()) {
            statement.execute(sql);
        }
    }

    private static void refused(String role, String sql) {
        assertThatThrownBy(() -> allowed(role, sql))
                .as("%s: %s", role, sql)
                .hasMessageContaining("permission denied");
    }

    private static String grants() throws SQLException {
        return single("""
                select string_agg(format('%s %s %s', c.oid::regclass, c.relacl, (
                           select string_agg(a.attname || '=' || a.attacl::text, ',' order by a.attname)
                           from pg_attribute a where a.attrelid = c.oid and a.attacl is not null)), ';' order by c.oid::regclass::text)
                       || (select string_agg(d.defaclacl::text, ';' order by d.defaclacl::text) from pg_default_acl d)
                from pg_class c join pg_namespace n on n.oid = c.relnamespace
                where n.nspname in ('app', 'auth', 'web', 'drizzle')
                """);
    }

    private static String single(String sql) throws SQLException {
        try (Connection owner = ownerOf(DATABASE); Statement statement = owner.createStatement();
                ResultSet rows = statement.executeQuery(sql)) {
            rows.next();
            return rows.getString(1);
        }
    }

    private static Connection ownerOf(String database) throws SQLException {
        return DriverManager.getConnection(DatabaseRoles.url(POSTGRES, database), POSTGRES.getUsername(),
                POSTGRES.getPassword());
    }
}
