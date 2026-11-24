package disscount.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** The image compiles its own module copy, so an input left out of the Dockerfile passes CI and breaks production. */
class DockerImageBuildTest {

    @Test
    void theImageBuildCopiesEveryCompileInput() throws IOException {
        List<String> copies = Files.readAllLines(Path.of("Dockerfile")).stream()
                .map(String::strip)
                .filter(line -> line.startsWith("COPY ") && !line.startsWith("COPY --from"))
                .toList();

        for (String input : List.of("pom.xml", "lombok.config", "src")) {
            assertThat(Path.of(input)).exists();
            assertThat(copies).as("Dockerfile COPY of " + input).anyMatch(line -> line.matches("COPY " + input + "\\b.*"));
        }
    }
}
