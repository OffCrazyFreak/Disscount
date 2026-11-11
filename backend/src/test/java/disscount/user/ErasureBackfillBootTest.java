package disscount.user;

import disscount.support.MigratedPostgres;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;

/** The backfill boots the whole app without a web server (docs/AUTH.md, Soft delete), so no web-only bean may be needed. */
@MigratedPostgres
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles(ErasureBackfillRunner.PROFILE)
@ExtendWith(OutputCaptureExtension.class)
class ErasureBackfillBootTest {

    // Other classes leave deleted profiles behind, and erasing them reads better-auth's tables, which the test database lacks.
    @MockitoBean AuthIdentityDao authIdentities;

    @Test
    void startsWithoutAWebServerAndRunsTheBackfill(CapturedOutput output) {
        assertThat(output).contains("Erasure backfill: ");
    }
}
