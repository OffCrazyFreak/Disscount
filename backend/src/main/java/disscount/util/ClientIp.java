package disscount.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.web.util.matcher.IpAddressMatcher;

import java.util.List;
import java.util.regex.Pattern;

/** Traefik writes its peer as the last X-Forwarded-For hop, the one trusted; CF-Connecting-IP only from Cloudflare. */
public final class ClientIp {

    private ClientIp() {}

    // https://www.cloudflare.com/ips/; cloudflare-ip-ranges.ts and Traefik trustedIPs carry the same list.
    private static final List<IpAddressMatcher> CLOUDFLARE = List.of(
            "173.245.48.0/20", "103.21.244.0/22", "103.22.200.0/22", "103.31.4.0/22",
            "141.101.64.0/18", "108.162.192.0/18", "190.93.240.0/20", "188.114.96.0/20",
            "197.234.240.0/22", "198.41.128.0/17", "162.158.0.0/15", "104.16.0.0/13",
            "104.24.0.0/14", "172.64.0.0/13", "131.0.72.0/22",
            "2400:cb00::/32", "2606:4700::/32", "2803:f800::/32", "2405:b500::/32",
            "2405:8100::/32", "2a06:98c0::/29", "2c0f:f248::/32"
    ).stream().map(IpAddressMatcher::new).toList();

    // Literals only: IpAddressMatcher resolves anything else through DNS.
    private static final Pattern IPV4 = Pattern.compile("\\d{1,3}(\\.\\d{1,3}){3}");
    private static final Pattern IPV6 = Pattern.compile("[0-9a-fA-F:.]*:[0-9a-fA-F:.]*");

    public static String resolve(HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        String peer = forwardedFor == null ? null : lastHop(forwardedFor);
        if (!isIpLiteral(peer)) {
            return request.getRemoteAddr();
        }

        String connectingIp = trimmed(request.getHeader("CF-Connecting-IP"));
        if (isIpLiteral(connectingIp) && isCloudflare(peer)) {
            return connectingIp;
        }
        return peer;
    }

    private static String lastHop(String forwardedFor) {
        return trimmed(forwardedFor.substring(forwardedFor.lastIndexOf(',') + 1));
    }

    private static String trimmed(String value) {
        return value == null ? null : value.trim();
    }

    private static boolean isIpLiteral(String value) {
        return value != null && (IPV4.matcher(value).matches() || IPV6.matcher(value).matches());
    }

    private static boolean isCloudflare(String ip) {
        try {
            return CLOUDFLARE.stream().anyMatch(range -> range.matches(ip));
        } catch (IllegalArgumentException malformed) {
            return false;
        }
    }
}
