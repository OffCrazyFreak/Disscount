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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.web.context.WebApplicationContext;
import static org.assertj.core.api.Assertions.assertThat;

/** The backfill boots the whole app without a web server (docs/AUTH.md, Soft delete), so no web-only bean may be needed. */
@MigratedPostgres
@SpringBootTest
@ActiveProfiles(ErasureBackfillRunner.PROFILE)
@ExtendWith(OutputCaptureExtension.class)
class ErasureBackfillBootTest {

    // Other classes leave deleted profiles behind, and erasing them reads better-auth's tables, which the test database lacks.
    @MockitoBean AuthIdentityDao authIdentities;

    @Autowired ApplicationContext context;

    // The profile file alone must switch the web server off, or the real one-off run starts Tomcat and never exits.
    @Test
    void theProfileFileSwitchesTheWebServerOff() {
        assertThat(context).isNotInstanceOf(WebApplicationContext.class);
        assertThat(context.getBeansOfType(SecurityFilterChain.class)).isEmpty();
    }

    @Test
    void startsWithoutAWebServerAndRunsTheBackfill(CapturedOutput output) {
        assertThat(output).contains("Erasure backfill: ");
    }
}
