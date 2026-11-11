package disscount.user;

import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/** The replay boots the whole app without a web server (docs/BACKUPS.md, Erasure replay), so no web-only bean may be needed. */
@MigratedPostgres
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles(ErasureReplayRunner.PROFILE)
@ExtendWith(OutputCaptureExtension.class)
class ErasureReplayBootTest {

    // The better-auth tables come from the web app's migrations, which the test database never runs.
    @MockitoBean AuthIdentityDao authIdentities;

    @DynamicPropertySource
    static void emptyMarkerFolder(DynamicPropertyRegistry registry) throws IOException {
        Path dir = Files.createTempDirectory("erasure-replay");
        Path markers = Files.createDirectory(dir.resolve("markers"));
        Path keyFile = Files.writeString(dir.resolve("hmac.key"), "e".repeat(64) + "\n");

        registry.add("erasure-replay.markers", markers::toString);
        registry.add("erasure-replay.key-file", keyFile::toString);
        registry.add("erasure-replay.allow-empty", () -> "true");
    }

    @Test
    void startsWithoutAWebServerAndRunsTheReplay(CapturedOutput output) {
        assertThat(output).contains("Erasure replay: 0 markers read, 0 restored accounts erased again");
    }
}
