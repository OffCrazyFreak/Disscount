package disscount.user.replay;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class ErasureReplayRunnerTest {

    private static final String MARKER = "d".repeat(64);

    @TempDir Path dir;

    private final ErasureReplay replay = mock(ErasureReplay.class);

    private ErasureReplayRunner runner(String key) throws Exception {
        Path keyFile = Files.writeString(dir.resolve("hmac.key"), key + "\n");
        Path markers = Files.createDirectories(dir.resolve("markers"));
        return new ErasureReplayRunner(replay, markers, keyFile);
    }

    @Test
    void passesTheKeyAndEveryMarkerToTheReplay() throws Exception {
        ErasureReplayRunner runner = runner("e".repeat(64));
        Files.writeString(dir.resolve("markers").resolve(MARKER), "{}");

        runner.run(null);

        verify(replay).replay(HexFormat.of().parseHex("e".repeat(64)), Set.of(MARKER));
    }

    @Test
    void refusesAFolderThatHoldsSomethingElse() throws Exception {
        ErasureReplayRunner runner = runner("e".repeat(64));
        Files.createDirectories(dir.resolve("markers").resolve("v1"));

        assertThatThrownBy(() -> runner.run(null)).hasMessageContaining("v1");
        verifyNoInteractions(replay);
    }

    @Test
    void refusesAShortKey() throws Exception {
        ErasureReplayRunner runner = runner("e".repeat(62));

        assertThatThrownBy(() -> runner.run(null)).hasMessageContaining("64 hex");
        verify(replay, never()).replay(any(), any());
    }
}
