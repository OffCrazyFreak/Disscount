package disscount.user.erasure;

import org.junit.jupiter.api.Test;

import java.util.HexFormat;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class ErasureMarkersTest {

    // From the backup image: printf %s "account:<id>" | openssl dgst -sha256 -mac HMAC -macopt hexkey:<64 times a>
    @Test
    void matchesTheSidecarsOpensslHmac() {
        byte[] key = HexFormat.of().parseHex("a".repeat(64));
        UUID id = UUID.fromString("00000000-0000-4000-8000-000000000001");

        assertThat(ErasureMarkers.name(key, "account", id))
                .isEqualTo("1237c61b788f4f5a990d80dbd0f219180da894412ecbe5fac20e79fab4be5588");
    }
}
