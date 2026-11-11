package disscount.flyway;

import java.util.Arrays;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationInfo;
import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.flywaydb.core.api.output.MigrateResult;

/** Runs one Flyway command on the backend tables and exits; the database login comes from FLYWAY_URL, FLYWAY_USER and FLYWAY_PASSWORD. */
public final class FlywayJob {

    private static final String MIGRATIONS = "filesystem:/flyway/sql";

    private static final String USAGE = """
            usage: migrate | info | validate | baseline <version>
              migrate             applies every pending migration (the default)
              info                lists each migration and whether it ran
              validate            checks that the files match what ran
              baseline <version>  marks a database whose tables already exist as being at <version>
            """;

    private FlywayJob() {
    }

    public static void main(String[] args) {
        String command = args.length == 0 ? "migrate" : args[0];
        String[] rest = args.length == 0 ? new String[0] : Arrays.copyOfRange(args, 1, args.length);

        try {
            System.exit(run(command, rest));
        } catch (FlywayException | IllegalArgumentException e) {
            System.err.println("flyway: " + command + " failed: " + e.getMessage());
            System.exit(1);
        }
    }

    private static int run(String command, String[] rest) {
        switch (command) {
            case "migrate" -> migrate();
            case "info" -> info();
            case "validate" -> configuration().load().validate();
            case "baseline" -> {
                if (rest.length != 1) {
                    System.err.print(USAGE);
                    return 2;
                }

                baseline(rest[0]);
            }
            default -> {
                System.err.print(USAGE);
                return 2;
            }
        }

        return 0;
    }

    private static void migrate() {
        MigrateResult result = configuration().load().migrate();

        System.out.println("flyway: " + result.migrationsExecuted + " migrations applied, schema now at version "
                + (result.targetSchemaVersion != null ? result.targetSchemaVersion : result.initialSchemaVersion));
    }

    private static void info() {
        for (MigrationInfo migration : configuration().load().info().all()) {
            System.out.printf("%-10s %-10s %-24s %s%n",
                    migration.getVersion(),
                    migration.getState().getDisplayName(),
                    migration.getInstalledOn() != null ? migration.getInstalledOn().toInstant() : "",
                    migration.getDescription());
        }
    }

    // No baselineOnMigrate anywhere: it would also baseline a fresh database whose only tables are better-auth's, and skip V1.
    private static void baseline(String version) {
        configuration()
                .baselineVersion(version)
                .baselineDescription("Tables made by Hibernate before Flyway")
                .load()
                .baseline();

        System.out.println("flyway: baselined at version " + version);
    }

    private static FluentConfiguration configuration() {
        return Flyway.configure()
                .dataSource(requiredEnv("FLYWAY_URL"), requiredEnv("FLYWAY_USER"), requiredEnv("FLYWAY_PASSWORD"))
                .locations(MIGRATIONS)
                // The history table stayed in public when the tables moved into app (V6), whatever a login's search_path says.
                .defaultSchema("public")
                .validateMigrationNaming(true);
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);

        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(name + " is not set");
        }

        return value;
    }
}
