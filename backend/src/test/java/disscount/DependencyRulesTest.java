package disscount;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;

/** The #429 dependency rules, read from the source because the owner chose no ArchUnit. */
class DependencyRulesTest {

    private static final Path MAIN = Path.of("src/main/java/disscount");

    private static final List<String> FEATURES = List.of(
            "contact", "digitalcard", "preferences", "productimage", "shoppinglist", "storename", "user", "watchlist");

    private static final Pattern REFERENCE = Pattern.compile("\\bdisscount\\.(\\w+)\\.(\\w+|\\*)");

    @Test
    void userImportsNoOtherFeature() throws IOException {
        assertThat(featureReferences("user"))
                .allMatch(reference -> reference.startsWith("user.") || reference.startsWith("shared."));
    }

    @Test
    void sharedImportsNoFeature() throws IOException {
        assertThat(featureReferences("shared"))
                .noneMatch(reference -> FEATURES.contains(reference.substring(0, reference.indexOf('.'))));
    }

    @Test
    void otherFeaturesKnowUsersOnlyThroughTheirPublicApi() throws IOException {
        for (String feature : FEATURES) {
            if (feature.equals("user")) continue;

            assertThat(featureReferences(feature))
                    .as(feature)
                    .filteredOn(reference -> reference.startsWith("user."))
                    .allMatch(reference -> reference.equals("user.ActiveUsers") || reference.equals("user.AccountErased"));
        }
    }

    /** Every disscount.<package>.<Name> written in the package's main sources, as "package.Name". */
    private static List<String> featureReferences(String packageName) throws IOException {
        try (Stream<Path> files = Files.walk(MAIN.resolve(packageName))) {
            return files.filter(file -> file.toString().endsWith(".java"))
                    .flatMap(DependencyRulesTest::references)
                    .distinct()
                    .toList();
        }
    }

    private static Stream<String> references(Path file) {
        try {
            Matcher matcher = REFERENCE.matcher(Files.readString(file));
            Stream.Builder<String> found = Stream.builder();
            while (matcher.find()) {
                found.add(matcher.group(1) + "." + matcher.group(2));
            }
            return found.build();
        } catch (IOException e) {
            throw new IllegalStateException(e);
        }
    }
}
