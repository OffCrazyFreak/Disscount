package disscount.shared;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/** A blank folder switches all its stores off; a blank public URL switches product photos off. */
@ConfigurationProperties("photos")
public record PhotoProperties(
        @DefaultValue("") String privateDir,
        @DefaultValue("") String publicDir,
        @DefaultValue("") String publicUrl
) {
}
