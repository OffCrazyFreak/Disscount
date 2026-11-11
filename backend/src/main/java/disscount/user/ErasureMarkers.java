package disscount.user;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.HexFormat;
import java.util.UUID;

/** Must match backup/bin/backup-job byte for byte: the hex HMAC-SHA256 of <scope>:<id> under _erasures/v1/. */
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
