package disscount.user;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Stream;

/** Run on a restored database before traffic reopens (docs/BACKUPS.md, Restore); a failure exits non-zero. */
@Component
@Profile(ErasureReplayRunner.PROFILE)
@EnableConfigurationProperties(ErasureReplayProperties.class)
@Slf4j
class ErasureReplayRunner implements ApplicationRunner {

    static final String PROFILE = "erasure-replay";

    private static final Pattern MARKER = Pattern.compile("[0-9a-f]{64}");

    private final ErasureReplay replay;
    private final Path markers;
    private final Path keyFile;
    private final boolean allowEmpty;

    ErasureReplayRunner(ErasureReplay replay, ErasureReplayProperties properties) {
        this.replay = replay;
        this.markers = properties.markers();
        this.keyFile = properties.keyFile();
        this.allowEmpty = properties.allowEmpty();
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        byte[] key = HexFormat.of().parseHex(Files.readString(keyFile).strip());
        if (key.length != 32) throw new IllegalStateException("The erasure key must be 64 hex characters");

        List<String> names;
        try (Stream<Path> files = Files.list(markers)) {
            names = files.map(file -> file.getFileName().toString()).toList();
        }
        // The wrong folder (say _erasures/ instead of _erasures/v1/) would otherwise match nothing and pass.
        List<String> strangers = names.stream().filter(name -> !MARKER.matcher(name).matches()).toList();
        if (!strangers.isEmpty()) {
            throw new IllegalStateException("Not erasure markers, check the folder: " + strangers);
        }
        // A failed download looks the same as a month with no deletions, so only the operator can say it is the latter.
        if (names.isEmpty() && !allowEmpty) {
            throw new IllegalStateException("No erasure markers found; pass --erasure-replay.allow-empty=true if none is expected");
        }

        Set<String> markerNames = Set.copyOf(names);
        int erased = replay.replay(key, markerNames);
        log.info("Erasure replay: {} markers read, {} restored accounts erased again", markerNames.size(), erased);
    }
}
