package disscount.support;

import java.io.IOException;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.testcontainers.containers.Container.ExecResult;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.MountableFile;

/** Runs db/database-roles.sql in a test container the way the owner runs it on a server, and logs in as its roles. */
public final class DatabaseRoles {

    public static final String MIGRATOR = "disscount_migrator";
    public static final String BACKEND = "disscount_backend";
    public static final String WEB = "disscount_web";

    private static final Path SCRIPT = Path.of("../db/database-roles.sql");
    private static final String SCRIPT_IN_CONTAINER = "/tmp/database-roles.sql";

    private DatabaseRoles() {
    }

    /** A role's password in tests is its own name. */
    public static String password(String role) {
        return role;
    }

    /** Runs the script as the container's owner login against one database, failing with psql's output. */
    public static void apply(PostgreSQLContainer postgres, String database) throws IOException, InterruptedException {
        postgres.copyFileToContainer(MountableFile.forHostPath(SCRIPT), SCRIPT_IN_CONTAINER);

        ExecResult result = postgres.execInContainer("env",
                "MIGRATOR_PASSWORD=" + password(MIGRATOR),
                "BACKEND_PASSWORD=" + password(BACKEND),
                "WEB_PASSWORD=" + password(WEB),
                "psql", "-X", "-U", postgres.getUsername(), "-d", database, "-f", SCRIPT_IN_CONTAINER);

        if (result.getExitCode() != 0) {
            throw new IllegalStateException("database-roles.sql failed: " + result.getStderr() + result.getStdout());
        }
    }

    public static Connection connect(PostgreSQLContainer postgres, String database, String role) throws SQLException {
        return DriverManager.getConnection(url(postgres, database), role, password(role));
    }

    public static String url(PostgreSQLContainer postgres, String database) {
        return postgres.getJdbcUrl().replace("/" + postgres.getDatabaseName(), "/" + database);
    }
}
