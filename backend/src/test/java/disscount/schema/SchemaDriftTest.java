package disscount.schema;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.function.Function;
import java.util.stream.Collectors;

import javax.sql.DataSource;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.testcontainers.postgresql.PostgreSQLContainer;

import disscount.schema.Catalog.CheckRow;
import disscount.schema.Catalog.ColumnRow;
import disscount.schema.Catalog.IndexRow;
import disscount.schema.Catalog.KeyRow;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;

/**
 * The migrations against what Hibernate would create from the entities. Starting this context already proves
 * ddl-auto=validate accepts the migrated tables; validate reads only tables, columns and types, so this compares
 * the rest: nullability, enum checks, keys and indexes.
 */
@MigratedPostgres
class SchemaDriftTest extends FullStackTest {

    private static final String REFERENCE_DATABASE = "hibernate_reference";

    private static Catalog migrated;
    private static Catalog hibernate;

    @Autowired DataSource dataSource;

    // The script exists only once the context has started, so this runs before the first test, not in @BeforeAll.
    @BeforeEach
    void readBothCatalogs() throws SQLException, IOException {
        if (migrated != null) {
            return;
        }

        PostgreSQLContainer postgres = MigratedPostgres.Database.POSTGRES;

        try (Connection admin = postgres.createConnection("");
                Statement statement = admin.createStatement()) {
            statement.execute("drop database if exists " + REFERENCE_DATABASE);
            statement.execute("create database " + REFERENCE_DATABASE);
        }

        String referenceUrl = postgres.getJdbcUrl().replace("/" + postgres.getDatabaseName(), "/" + REFERENCE_DATABASE);

        try (Connection reference = DriverManager.getConnection(referenceUrl, postgres.getUsername(), postgres.getPassword());
                Connection connection = dataSource.getConnection()) {
            try (Statement statement = reference.createStatement()) {
                statement.execute(Files.readString(Path.of(MigratedPostgres.HIBERNATE_DDL)));
            }

            Set<String> entityTables = Catalog.tables(reference);
            hibernate = Catalog.read(reference, entityTables);
            migrated = Catalog.read(connection, entityTables);
        }
    }

    @Test
    void everyEntityColumnHasTheTypeAndNullabilityHibernateExpects() throws Exception {
        Map<String, ColumnRow> migratedColumns = byKey(migrated.columns(), column -> column.table() + "." + column.column());

        for (ColumnRow expected : hibernate.columns()) {
            ColumnRow actual = migratedColumns.get(expected.table() + "." + expected.column());

            assertThat(actual).as(expected.table() + "." + expected.column()).isNotNull();
            assertThat(actual.type()).as(expected.table() + "." + expected.column()).isEqualTo(expected.type());
            assertThat(actual.notNull()).as(expected.table() + "." + expected.column() + " not null").isEqualTo(expected.notNull());
        }
    }

    // A column the entities no longer write must accept the insert that leaves it out.
    @Test
    void everyColumnOutsideTheEntitiesIsNullableOrHasADefault() throws Exception {
        Set<String> entityColumns = keys(hibernate.columns(), column -> column.table() + "." + column.column());

        List<String> blocking = migrated.columns().stream()
                .filter(column -> !entityColumns.contains(column.table() + "." + column.column()))
                .filter(column -> column.notNull() && !column.hasDefault())
                .map(column -> column.table() + "." + column.column())
                .toList();

        assertThat(blocking).isEmpty();
    }

    @Test
    void everyEnumCheckListsTheEnumValuesUnderItsCkName() throws Exception {
        assertThat(checksByColumn(migrated)).isEqualTo(checksByColumn(hibernate));

        for (CheckRow check : migrated.checks()) {
            assertThat(check.name()).isEqualTo("ck_" + check.table() + "_" + check.column());
        }
    }

    @Test
    void primaryKeysAndUniqueColumnsMatchTheEntities() throws Exception {
        assertThat(primaryKeys(migrated)).isEqualTo(primaryKeys(hibernate));
        assertThat(uniqueColumns(migrated)).isEqualTo(uniqueColumns(hibernate));
    }

    @Test
    void everyIndexTheEntitiesDeclareExists() throws Exception {
        Set<String> migratedIndexes = keys(migrated.indexes(), SchemaDriftTest::describe);

        for (IndexRow index : hibernate.indexes()) {
            if (!index.unique()) {
                assertThat(migratedIndexes).contains(describe(index));
            }
        }
    }

    @Test
    void foreignKeysCoverTheEntitiesAndEachHasAnIndex() throws Exception {
        Set<String> migratedForeignKeys = foreignKeys(migrated);

        assertThat(migratedForeignKeys).containsAll(foreignKeys(hibernate));

        for (KeyRow key : migrated.keys()) {
            if (key.type() == 'f') {
                assertThat(migrated.indexes())
                        .as("an index starting with " + key.table() + key.columns())
                        .anyMatch(index -> index.table().equals(key.table())
                                && !index.partial()
                                && index.columns().size() >= key.columns().size()
                                && index.columns().subList(0, key.columns().size()).equals(key.columns()));
            }
        }
    }

    // Features hold a user as a plain id, so Hibernate knows none of these; only the migrations keep them.
    @Test
    void everyUserIdColumnPointsAtTheUserTable() throws Exception {
        Set<String> toUsers = migrated.keys().stream()
                .filter(key -> key.type() == 'f' && key.references().equals("app_user"))
                .map(key -> key.table() + "." + String.join(",", key.columns()))
                .collect(Collectors.toCollection(TreeSet::new));

        assertThat(toUsers).containsExactlyInAnyOrder(
                "contact_message.user_id",
                "favorite_store.user_id",
                "pinned_place.user_id",
                "pinned_store.user_id",
                "shopping_list.owner_id",
                "shopping_list_item.updated_by_user_id",
                "wallet_card.user_id",
                "watchlist_item.user_id");
    }

    private static Map<String, Set<String>> checksByColumn(Catalog catalog) {
        return catalog.checks().stream()
                .collect(Collectors.toMap(check -> check.table() + "." + check.column(), CheckRow::values));
    }

    private static Set<String> primaryKeys(Catalog catalog) {
        return catalog.keys().stream()
                .filter(key -> key.type() == 'p')
                .map(key -> key.table() + key.columns())
                .collect(Collectors.toCollection(TreeSet::new));
    }

    // A unique constraint and a plain unique index enforce the same rule; a partial one is a migration's own rule.
    private static Set<String> uniqueColumns(Catalog catalog) {
        Set<String> primaryKeys = primaryKeys(catalog);

        return catalog.indexes().stream()
                .filter(index -> index.unique() && !index.partial())
                .map(index -> index.table() + index.columns())
                .filter(columns -> !primaryKeys.contains(columns))
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static Set<String> foreignKeys(Catalog catalog) {
        return catalog.keys().stream()
                .filter(key -> key.type() == 'f')
                .map(key -> key.table() + key.columns() + " -> " + key.references())
                .collect(Collectors.toCollection(TreeSet::new));
    }

    private static String describe(IndexRow index) {
        return index.table() + index.columns() + (index.unique() ? " unique" : "") + (index.partial() ? " partial" : "");
    }

    private static <T> Map<String, T> byKey(List<T> rows, Function<T, String> key) {
        return rows.stream().collect(Collectors.toMap(key, Function.identity()));
    }

    private static <T> Set<String> keys(List<T> rows, Function<T, String> key) {
        return rows.stream().map(key).collect(Collectors.toCollection(TreeSet::new));
    }
}
