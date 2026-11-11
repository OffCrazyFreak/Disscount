package disscount.config;

import java.io.IOException;
import java.io.Reader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Properties;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Read from disk because the test application.properties shadows main's on the classpath and keeps springdoc on. */
class SpringdocProfileTest {

    private static final Path RESOURCES = Path.of("src/main/resources");

    @Test
    void mainKeepsTheApiDocsOff() throws IOException {
        Properties main = load("application.properties");

        assertThat(main.getProperty("springdoc.api-docs.enabled")).isEqualTo("false");
        assertThat(main.getProperty("springdoc.swagger-ui.enabled")).isEqualTo("false");
    }

    @Test
    void theLocalProfileTurnsThemOn() throws IOException {
        Properties local = load("application-local.properties");

        assertThat(local.getProperty("springdoc.api-docs.enabled")).isEqualTo("true");
        assertThat(local.getProperty("springdoc.swagger-ui.enabled")).isEqualTo("true");
    }

    private static Properties load(String file) throws IOException {
        Properties properties = new Properties();

        try (Reader reader = Files.newBufferedReader(RESOURCES.resolve(file))) {
            properties.load(reader);
        }

        return properties;
    }
}
