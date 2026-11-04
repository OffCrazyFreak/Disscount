package disscount.support;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.json.JsonMapper;

import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.TreeSet;

import static org.assertj.core.api.Assertions.assertThat;

/** Wire format tests read real responses against it, so a response, this file and the zod schemas cannot disagree. */
public final class ApiContract {

    // Surefire runs from backend/, and the file sits above it because both sides read it.
    public static final Path FILE = Path.of("..", "contracts", "backend-api.json");

    private static final ObjectMapper JSON = JsonMapper.builder().build();

    private ApiContract() {}

    // Read on demand, so a broken file (say, merge conflict markers) never blocks the test that rewrites it.
    public static JsonNode committed() {
        return JSON.readTree(FILE.toFile());
    }

    /** A real response holds exactly the contract's keys, nested DTOs included, and only the nulls it declares. */
    public static void assertMatches(String schema, JsonNode response) {
        List<String> problems = new ArrayList<>();
        collectProblems(committed().path("schemas"), schema, response, schema, problems);
        assertThat(problems).as("response against %s in %s", schema, FILE).isEmpty();
    }

    private static void collectProblems(JsonNode schemas, String schema, JsonNode node, String path, List<String> problems) {
        JsonNode properties = schemas.path(schema).path("properties");
        if (properties.isMissingNode()) {
            throw new IllegalArgumentException(schema + " is not in " + FILE);
        }
        if (!new TreeSet<>(properties.propertyNames()).equals(new TreeSet<>(node.propertyNames()))) {
            problems.add(path + " has keys " + node.propertyNames());
        }
        for (String field : node.propertyNames()) {
            JsonNode property = properties.path(field);
            JsonNode value = node.get(field);
            String fieldPath = path + "." + field;
            if (value.isNull()) {
                if (!property.isMissingNode() && !isNullable(property)) {
                    problems.add(fieldPath + " is null but not nullable; mark it @Schema(nullable = true)");
                }
            } else if (value.isObject() && property.has("$ref")) {
                collectProblems(schemas, referenced(property), value, fieldPath, problems);
            } else if (value.isArray() && property.path("items").has("$ref")) {
                for (JsonNode element : value) {
                    collectProblems(schemas, referenced(property.path("items")), element, fieldPath + "[]", problems);
                }
            }
        }
    }

    // springdoc writes a nullable scalar as type ["string", "null"], and a nullable nested DTO as $ref beside type "null".
    private static boolean isNullable(JsonNode property) {
        JsonNode type = property.path("type");
        return type.isArray() ? type.valueStream().anyMatch(t -> "null".equals(t.asString())) : "null".equals(type.asString(""));
    }

    private static String referenced(JsonNode property) {
        String reference = property.get("$ref").asString();
        return reference.substring(reference.lastIndexOf('/') + 1);
    }
}
