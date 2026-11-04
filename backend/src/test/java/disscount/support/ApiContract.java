package disscount.support;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.nio.file.Path;
import java.util.Set;
import java.util.TreeSet;

/**
 * The committed contract the frontend's zod schemas are checked against. Wire format tests read
 * their field lists from it, so a real response, this file and the zod schemas cannot disagree.
 */
public final class ApiContract {

    // Surefire runs from backend/, and the file sits above it because both sides read it.
    public static final Path FILE = Path.of("..", "contracts", "backend-api.json");

    private static final ObjectMapper JSON = JsonMapper.builder().build();

    private ApiContract() {}

    // Read on demand, so a broken file (say, merge conflict markers) never blocks the test that rewrites it.
    public static JsonNode committed() {
        return JSON.readTree(FILE.toFile());
    }

    public static Set<String> fields(String schema) {
        JsonNode properties = committed().path("schemas").path(schema).path("properties");
        if (properties.isMissingNode()) {
            throw new IllegalArgumentException(schema + " is not in " + FILE);
        }
        return new TreeSet<>(properties.propertyNames());
    }
}
