package disscount.schema;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** The parts of the app schema that Hibernate's validate never reads: nullability, checks, keys and indexes. */
record Catalog(
        List<ColumnRow> columns,
        List<CheckRow> checks,
        List<KeyRow> keys,
        List<IndexRow> indexes
) {

    record ColumnRow(String table, String column, String type, boolean notNull, boolean hasDefault) {
    }

    record CheckRow(String table, String name, String column, Set<String> values) {
    }

    /** A primary key, unique constraint or foreign key; references is the target table of a foreign key. */
    record KeyRow(String table, String name, char type, List<String> columns, String references) {
    }

    record IndexRow(String table, String name, boolean unique, boolean partial, List<String> columns) {
    }

    private static final Pattern QUOTED = Pattern.compile("'([^']*)'");

    private static final String COLUMNS = """
            select c.relname, a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull, a.atthasdef
            from pg_class c
            join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'app'
            join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
            where c.relkind = 'r' and c.relname = any (?)
            """;

    private static final String CONSTRAINTS = """
            select c.relname, con.conname, con.contype, pg_get_constraintdef(con.oid),
                   array(select a.attname
                         from unnest(con.conkey) with ordinality as k(attnum, position)
                         join pg_attribute a on a.attrelid = con.conrelid and a.attnum = k.attnum
                         order by k.position),
                   coalesce(target.relname, '')
            from pg_constraint con
            join pg_class c on c.oid = con.conrelid
            join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'app'
            left join pg_class target on target.oid = con.confrelid
            where c.relname = any (?)
            """;

    private static final String INDEXES = """
            select c.relname, i.relname, x.indisunique, x.indpred is not null,
                   array(select a.attname
                         from unnest(x.indkey::int2[]) with ordinality as k(attnum, position)
                         join pg_attribute a on a.attrelid = x.indrelid and a.attnum = k.attnum
                         order by k.position)
            from pg_index x
            join pg_class c on c.oid = x.indrelid
            join pg_class i on i.oid = x.indexrelid
            join pg_namespace n on n.oid = c.relnamespace and n.nspname = 'app'
            where c.relname = any (?)
            """;

    static Catalog read(Connection connection, Set<String> tables) throws SQLException {
        String[] names = tables.toArray(String[]::new);

        List<ColumnRow> columns = new ArrayList<>();
        try (ResultSet rows = query(connection, COLUMNS, names)) {
            while (rows.next()) {
                columns.add(new ColumnRow(rows.getString(1), rows.getString(2), rows.getString(3),
                        rows.getBoolean(4), rows.getBoolean(5)));
            }
        }

        List<CheckRow> checks = new ArrayList<>();
        List<KeyRow> keys = new ArrayList<>();
        try (ResultSet rows = query(connection, CONSTRAINTS, names)) {
            while (rows.next()) {
                char type = rows.getString(3).charAt(0);
                List<String> keyColumns = List.of((String[]) rows.getArray(5).getArray());

                if (type == 'c') {
                    checks.add(new CheckRow(rows.getString(1), rows.getString(2), String.join(",", keyColumns),
                            quotedValues(rows.getString(4))));
                } else {
                    keys.add(new KeyRow(rows.getString(1), rows.getString(2), type, keyColumns, rows.getString(6)));
                }
            }
        }

        List<IndexRow> indexes = new ArrayList<>();
        try (ResultSet rows = query(connection, INDEXES, names)) {
            while (rows.next()) {
                indexes.add(new IndexRow(rows.getString(1), rows.getString(2), rows.getBoolean(3), rows.getBoolean(4),
                        List.of((String[]) rows.getArray(5).getArray())));
            }
        }

        return new Catalog(columns, checks, keys, indexes);
    }

    static Set<String> tables(Connection connection) throws SQLException {
        Set<String> tables = new TreeSet<>();

        try (PreparedStatement statement = connection.prepareStatement(
                "select tablename from pg_tables where schemaname = 'app'");
                ResultSet rows = statement.executeQuery()) {
            while (rows.next()) {
                tables.add(rows.getString(1));
            }
        }

        return tables;
    }

    private static ResultSet query(Connection connection, String sql, String[] tables) throws SQLException {
        PreparedStatement statement = connection.prepareStatement(sql);
        statement.setArray(1, connection.createArrayOf("text", tables));
        statement.closeOnCompletion();

        return statement.executeQuery();
    }

    private static Set<String> quotedValues(String definition) {
        Set<String> values = new TreeSet<>();
        Matcher matcher = QUOTED.matcher(definition);

        while (matcher.find()) {
            values.add(matcher.group(1));
        }

        return values;
    }
}
