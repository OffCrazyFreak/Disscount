package disscount.config;

import disscount.support.FullStackTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/** UserForeignKeys leans on Hibernate internals, so a Hibernate upgrade that skips it must fail here, not on a new database. */
class UserForeignKeysTest extends FullStackTest {

    @Autowired DataSource dataSource;

    @Test
    void everyUserIdColumnPointsAtTheUserTable() throws SQLException {
        assertThat(columnsReferencingAppUser()).containsExactlyInAnyOrder(
                "contact_message.user_id",
                "favorite_store.user_id",
                "pinned_place.user_id",
                "pinned_store.user_id",
                "shopping_list.owner_id",
                "shopping_list_item.updated_by_user_id",
                "wallet_card.user_id",
                "watchlist_item.user_id");
    }

    private Set<String> columnsReferencingAppUser() throws SQLException {
        Set<String> columns = new HashSet<>();

        try (Connection connection = dataSource.getConnection();
                ResultSet keys = connection.getMetaData().getExportedKeys(null, null, "APP_USER")) {
            while (keys.next()) {
                columns.add((keys.getString("FKTABLE_NAME") + "." + keys.getString("FKCOLUMN_NAME")).toLowerCase());
            }
        }

        return columns;
    }
}
