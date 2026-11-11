package disscount.user;

import java.nio.file.Path;

import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

@Validated
@ConfigurationProperties("erasure-replay")
record ErasureReplayProperties(
        @NotNull Path markers,
        @NotNull Path keyFile,
        @DefaultValue("false") boolean allowEmpty
) {
}
