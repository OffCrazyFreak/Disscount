package disscount.user.replay;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Names of the erasure markers the backup sidecar writes under {@code _erasures/v1/}: the hex
 * HMAC-SHA256 of {@code <scope>:<id>}. Must match {@code backup/bin/backup-job} byte for byte.
 */
final class ErasureMarkers {

    private ErasureMarkers() {}

    static String name(byte[] key, String scope, UUID id) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(key, "HmacSHA256"));
            byte[] digest = mac.doFinal((scope + ":" + id).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("HmacSHA256 is unavailable", e);
        }
    }
}
