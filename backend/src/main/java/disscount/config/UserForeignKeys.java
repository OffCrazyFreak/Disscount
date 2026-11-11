package disscount.config;

import java.util.List;
import java.util.Map;

import org.hibernate.MappingException;
import org.hibernate.boot.ResourceStreamLocator;
import org.hibernate.boot.model.naming.Identifier;
import org.hibernate.boot.spi.AdditionalMappingContributions;
import org.hibernate.boot.spi.AdditionalMappingContributor;
import org.hibernate.boot.spi.InFlightMetadataCollector;
import org.hibernate.boot.spi.MetadataBuildingContext;
import org.hibernate.boot.spi.SecondPass;
import org.hibernate.mapping.Column;
import org.hibernate.mapping.PersistentClass;
import org.hibernate.mapping.Table;

/**
 * Features hold a user as a plain id column (#429), which Hibernate gives no foreign key, so these restore them.
 * Registered in META-INF/services; once Flyway owns the schema (#429 R9) the migrations hold them instead.
 */
public class UserForeignKeys implements AdditionalMappingContributor {

    private static final String USER_TABLE = "app_user";

    private record UserColumn(String table, String column) {
    }

    private static final List<UserColumn> USER_COLUMNS = List.of(
            new UserColumn("contact_message", "user_id"),
            new UserColumn("favorite_store", "user_id"),
            new UserColumn("pinned_place", "user_id"),
            new UserColumn("pinned_store", "user_id"),
            new UserColumn("shopping_list", "owner_id"),
            new UserColumn("shopping_list_item", "updated_by_user_id"),
            new UserColumn("wallet_card", "user_id"),
            new UserColumn("watchlist_item", "user_id"));

    @Override
    public String getContributorName() {
        return "disscount-user-foreign-keys";
    }

    @Override
    public void contribute(
            AdditionalMappingContributions contributions,
            InFlightMetadataCollector metadata,
            ResourceStreamLocator resources,
            MetadataBuildingContext context
    ) {
        // A general second pass runs after entity binding and before Hibernate names and resolves foreign keys.
        metadata.addSecondPass((SecondPass) UserForeignKeys::addForeignKeys);
    }

    private static void addForeignKeys(Map<String, PersistentClass> entities) {
        String userEntity = entityOwning(entities, USER_TABLE).getEntityName();

        for (UserColumn userColumn : USER_COLUMNS) {
            Table table = entityOwning(entities, userColumn.table()).getTable();
            Column column = table.getColumn(Identifier.toIdentifier(userColumn.column()));
            if (column == null) {
                throw new MappingException("No column " + userColumn + " to point at " + USER_TABLE);
            }

            table.createForeignKey(null, List.of(column), userEntity, null, null);
        }
    }

    private static PersistentClass entityOwning(Map<String, PersistentClass> entities, String tableName) {
        return entities.values().stream()
                .filter(entity -> entity.getTable().getName().equals(tableName))
                .findFirst()
                .orElseThrow(() -> new MappingException("No entity maps table " + tableName));
    }
}
