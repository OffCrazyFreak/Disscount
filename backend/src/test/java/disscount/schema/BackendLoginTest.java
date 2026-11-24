package disscount.schema;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;

import disscount.support.DatabaseRoles;
import disscount.support.FullStackTest;
import disscount.support.MigratedPostgres;

/** The app itself runs as the backend login in the Postgres tests, so every one of them also proves its grants. */
@MigratedPostgres
class BackendLoginTest extends FullStackTest {

    @Autowired JdbcTemplate jdbc;

    @Test
    void theAppConnectsAsTheBackendLogin() {
        assertThat(jdbc.queryForObject("select current_user", String.class)).isEqualTo(DatabaseRoles.BACKEND);
    }

    // So every native query in these tests must name its schema, as on a login without the fallback path.
    @Test
    void theTestConnectionsFindNoTableWithoutItsSchema() {
        assertThat(jdbc.queryForObject("show search_path", String.class)).isEqualTo("public");
    }

    @Test
    void theAppCannotRewriteTheAdminAudit() {
        assertThatThrownBy(() -> jdbc.update("delete from app.admin_audit")).rootCause().hasMessageContaining("permission denied");
        assertThatThrownBy(() -> jdbc.update("update app.admin_audit set action = action"))
                .rootCause().hasMessageContaining("permission denied");
    }
}
