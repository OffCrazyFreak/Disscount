package disscount.config;

import com.nimbusds.jose.JOSEObjectType;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.ECDSASigner;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.jwk.Curve;
import com.nimbusds.jose.jwk.ECKey;
import com.nimbusds.jose.jwk.JWKSet;
import com.nimbusds.jose.jwk.gen.ECKeyGenerator;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;

import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Runs the production decoder against a local JWKS, so a Spring Security upgrade that adds a
 * default validator (a typ check, say) shows up here before it logs every user out.
 */
class JwtDecoderCharacterizationTest {

    private static final String ISSUER = "http://localhost:3000";

    private static HttpServer jwks;
    private static ECKey signingKey;
    private static JwtDecoder decoder;

    @BeforeAll
    static void serveJwks() throws Exception {
        signingKey = new ECKeyGenerator(Curve.P_256).keyID("better-auth").generate();
        byte[] body = new JWKSet(signingKey.toPublicJWK()).toString().getBytes(StandardCharsets.UTF_8);

        jwks = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        jwks.createContext("/api/auth/jwks", exchange -> {
            exchange.getResponseHeaders().add("Content-Type", "application/json");
            exchange.sendResponseHeaders(200, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        });
        jwks.start();

        String jwksUri = "http://127.0.0.1:" + jwks.getAddress().getPort() + "/api/auth/jwks";
        decoder = new SecurityConfig(null, null).jwtDecoder(jwksUri, ISSUER);
    }

    @AfterAll
    static void stopJwks() {
        jwks.stop(0);
    }

    private static JWTClaimsSet.Builder claims() {
        return new JWTClaimsSet.Builder()
                .subject(UUID.randomUUID().toString())
                .issuer(ISSUER)
                .audience(ISSUER)
                .issueTime(new Date())
                .expirationTime(Date.from(Instant.now().plusSeconds(900)))
                .claim("email", "ana@example.com");
    }

    private static String es256(JWTClaimsSet claims, JOSEObjectType type) throws Exception {
        JWSHeader header = new JWSHeader.Builder(JWSAlgorithm.ES256).keyID(signingKey.getKeyID()).type(type).build();
        SignedJWT jwt = new SignedJWT(header, claims);
        jwt.sign(new ECDSASigner(signingKey));
        return jwt.serialize();
    }

    @Test
    void anEs256TokenFromOurIssuerDecodesWithOrWithoutATypHeader() throws Exception {
        assertThat(decoder.decode(es256(claims().build(), JOSEObjectType.JWT)).getClaimAsString("email"))
                .isEqualTo("ana@example.com");
        assertThat(decoder.decode(es256(claims().build(), null)).getSubject()).isNotBlank();
    }

    @Test
    void aTokenFromAnotherIssuerIsRejected() {
        assertThatThrownBy(() -> decoder.decode(es256(claims().issuer("https://elsewhere.example").build(), null)))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void aTokenMeantForAnotherAudienceIsRejected() {
        assertThatThrownBy(() -> decoder.decode(es256(claims().audience("https://elsewhere.example").build(), null)))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void aTokenWithoutAnAudienceIsRejected() {
        assertThatThrownBy(() -> decoder.decode(es256(claims().audience((String) null).build(), null)))
                .isInstanceOf(JwtException.class);
    }

    @Test
    void anExpiredTokenIsRejectedOnceTheClockSkewHasPassed() {
        JWTClaimsSet expired = claims().expirationTime(Date.from(Instant.now().minusSeconds(120))).build();

        assertThatThrownBy(() -> decoder.decode(es256(expired, null))).isInstanceOf(JwtException.class);
    }

    @Test
    void aTokenSignedWithAnotherAlgorithmIsRejected() throws Exception {
        SignedJWT hs256 = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims().build());
        hs256.sign(new MACSigner(new byte[32]));

        assertThatThrownBy(() -> decoder.decode(hs256.serialize())).isInstanceOf(JwtException.class);
    }
}
