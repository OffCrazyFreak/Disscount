package disscount.shared;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import static org.assertj.core.api.Assertions.assertThat;

class ClientIpTest {

    private static final String CLOUDFLARE_EDGE = "172.70.1.2";
    private static final String VISITOR = "93.140.10.20";
    private static final String DIRECT_CALLER = "198.51.100.7";

    private static MockHttpServletRequest request(String forwardedFor, String connectingIp) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr("10.0.1.5");
        if (forwardedFor != null) request.addHeader("X-Forwarded-For", forwardedFor);
        if (connectingIp != null) request.addHeader("CF-Connecting-IP", connectingIp);
        return request;
    }

    @Test
    void takesTheCloudflareHeaderWhenTraefiksPeerIsACloudflareEdge() {
        assertThat(ClientIp.resolve(request(VISITOR + ", " + CLOUDFLARE_EDGE, VISITOR))).isEqualTo(VISITOR);
    }

    @Test
    void acceptsAnIpv6CloudflareEdge() {
        assertThat(ClientIp.resolve(request("2606:4700:10::1", VISITOR))).isEqualTo(VISITOR);
    }

    @Test
    void ignoresAForgedHeaderFromACallerThatBypassedCloudflare() {
        assertThat(ClientIp.resolve(request(DIRECT_CALLER, "203.0.113.99"))).isEqualTo(DIRECT_CALLER);
    }

    @Test
    void ignoresASpoofedCloudflareHopLeftOfTheRealPeer() {
        assertThat(ClientIp.resolve(request(CLOUDFLARE_EDGE + ", " + DIRECT_CALLER, "203.0.113.99")))
                .isEqualTo(DIRECT_CALLER);
    }

    @Test
    void neverResolvesAHostName() {
        assertThat(ClientIp.resolve(request(CLOUDFLARE_EDGE, "example.com"))).isEqualTo(CLOUDFLARE_EDGE);
        assertThat(ClientIp.resolve(request("example.com", VISITOR))).isEqualTo("10.0.1.5");
    }

    @Test
    void fallsBackToThePeerWithoutForwardedHeaders() {
        assertThat(ClientIp.resolve(request(null, VISITOR))).isEqualTo("10.0.1.5");
    }
}
