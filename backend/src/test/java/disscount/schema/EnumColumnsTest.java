package disscount.schema;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.engine.spi.SessionFactoryImplementor;
import org.hibernate.metamodel.mapping.BasicValuedModelPart;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;

import jakarta.persistence.EntityManagerFactory;

/**
 * Every value of every enum column inserts on the migrated tables. Hibernate's validate never reads a CHECK,
 * so a new enum value without a migration that widens its check would pass every other test and fail in production.
 */
@MigratedPostgres
class EnumColumnsTest extends FullStackTest {

    private record EnumColumn(String table, String column, Object storedValue) {
    }

    @Autowired EntityManagerFactory entityManagerFactory;
    @Autowired JdbcTemplate jdbc;
    @Autowired TransactionTemplate transactions;

    @Test
    void everyEnumValueInserts() {
        List<EnumColumn> values = storedEnumValues();

        // The seven enum columns of 2026-11-11; the count only guards against finding none.
        assertThat(values.stream().map(value -> value.table() + "." + value.column()).distinct())
                .hasSizeGreaterThanOrEqualTo(7);

        List<String> refused = new ArrayList<>();

        for (EnumColumn value : values) {
            try {
                insertInto(value);
            } catch (DataAccessException e) {
                refused.add(value.table() + "." + value.column() + " = " + value.storedValue());
            }
        }

        // Every refused value at once, so one run lists every check a migration has to widen.
        assertThat(refused).isEmpty();
    }

    // Through Hibernate's own conversion, so a column with an AttributeConverter stores what the app stores.
    private List<EnumColumn> storedEnumValues() {
        List<EnumColumn> values = new ArrayList<>();

        entityManagerFactory.unwrap(SessionFactoryImplementor.class).getMappingMetamodel().forEachEntityDescriptor(entity ->
                entity.forEachAttributeMapping(attribute -> {
                    if (attribute instanceof BasicValuedModelPart column && column.getJavaType().getJavaTypeClass().isEnum()) {
                        for (Object constant : column.getJavaType().getJavaTypeClass().getEnumConstants()) {
                            values.add(new EnumColumn(column.getContainingTableExpression(), column.getSelectionExpression(),
                                    stored(column.getJdbcMapping().convertToRelationalValue(constant))));
                        }
                    }
                }));

        return values;
    }

    // A converter returns the stored value; @Enumerated(STRING) leaves the enum to its JDBC binding, which writes the name.
    private static Object stored(Object relational) {
        return relational instanceof Enum<?> constant ? constant.name() : relational;
    }

    // A copy with the table's checks and no NOT NULL, so one column can be inserted alone; rolled back afterwards.
    private void insertInto(EnumColumn value) {
        transactions.executeWithoutResult(status -> {
            jdbc.execute("create temp table enum_probe (like " + value.table() + " including constraints) on commit drop");

            for (String column : jdbc.queryForList("""
                    select attname from pg_attribute
                    where attrelid = 'enum_probe'::regclass and attnum > 0 and attnotnull and not attisdropped
                    """, String.class)) {
                jdbc.execute("alter table enum_probe alter column " + column + " drop not null");
            }

            jdbc.update("insert into enum_probe (" + value.column() + ") values (?)", value.storedValue());
            status.setRollbackOnly();
        });
    }
}
