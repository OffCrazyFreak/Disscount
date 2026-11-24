package disscount.user.erasure;

import disscount.support.MigratedPostgres;
import disscount.user.AuthIdentityDao;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.context.ApplicationContext;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.context.WebApplicationContext;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

/** The replay boots the whole app without a web server (docs/BACKUPS.md, Erasure replay), so no web-only bean may be needed. */
@MigratedPostgres
@SpringBootTest
@ActiveProfiles(ErasureReplayRunner.PROFILE)
@ExtendWith(OutputCaptureExtension.class)
class ErasureReplayBootTest {

    // The better-auth tables come from the web app's migrations, which the test database never runs.
    @MockitoBean AuthIdentityDao authIdentities;

    @Autowired ApplicationContext context;

    @DynamicPropertySource
    static void emptyMarkerFolder(DynamicPropertyRegistry registry) throws IOException {
        Path dir = Files.createTempDirectory("erasure-replay");
        Path markers = Files.createDirectory(dir.resolve("markers"));
        Path keyFile = Files.writeString(dir.resolve("hmac.key"), "e".repeat(64) + "\n");

        registry.add("erasure-replay.markers", markers::toString);
        registry.add("erasure-replay.key-file", keyFile::toString);
        registry.add("erasure-replay.allow-empty", () -> "true");
    }

    // The profile file alone must switch the web server off, or the real one-off run starts Tomcat and never exits.
    @Test
    void theProfileFileSwitchesTheWebServerOff() {
        assertThat(context).isNotInstanceOf(WebApplicationContext.class);
        assertThat(context.getBeansOfType(SecurityFilterChain.class)).isEmpty();
    }

    @Test
    void startsWithoutAWebServerAndRunsTheReplay(CapturedOutput output) {
        assertThat(output).contains("Erasure replay: 0 markers read, 0 restored accounts erased again");
    }
}
