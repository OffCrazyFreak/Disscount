package disccount.auth.rest;

import disccount.auth.dto.*;
import disccount.auth.service.AuthService;
import disccount.auth.service.JwtService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication and user management endpoints")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    private static final String REFRESH_COOKIE_NAME = "refreshToken";
    private static final String COOKIE_PATH = "/";

    private String createRefreshCookieHeader(String token) {
        // Build Set-Cookie header value to include SameSite=None (Servlet Cookie has no direct setter for SameSite)
        StringBuilder sb = new StringBuilder();
        sb.append(REFRESH_COOKIE_NAME).append("=").append(token == null ? "" : token).append(";");
        sb.append(" Max-Age=").append(token == null ? 0 : jwtService.getRefreshTokenExpiration() / 1000).append(";");
        sb.append(" Path=").append(COOKIE_PATH).append(";");
        sb.append(" HttpOnly;");
        sb.append(" Secure;");
        sb.append(" SameSite=None;");
        return sb.toString();
    }

    @Operation(summary = "Register a new user")
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request,
                                                 HttpServletResponse servletResponse) {
        AuthResponse response = authService.register(request);

        String refreshToken = jwtService.generateRefreshToken(response.getUser().getEmail(), response.getUser().getId());
        String setCookie = createRefreshCookieHeader(refreshToken);
        servletResponse.addHeader("Set-Cookie", setCookie);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Login with email/username and password")
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request,
                                              HttpServletResponse servletResponse) {
        AuthResponse response = authService.login(request);

        String refreshToken = jwtService.generateRefreshToken(response.getUser().getEmail(), response.getUser().getId());
        String setCookie = createRefreshCookieHeader(refreshToken);
        servletResponse.addHeader("Set-Cookie", setCookie);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Refresh access token using refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refreshToken(HttpServletRequest servletRequest,
                                                     HttpServletResponse servletResponse) {
        // Read refresh token from cookie
        String refreshToken = null;
        if (servletRequest.getCookies() != null) {
            for (Cookie c : servletRequest.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).build();
        }

        AuthResponse response = authService.refreshToken(refreshToken);

        String setCookie = createRefreshCookieHeader(refreshToken);
        servletResponse.addHeader("Set-Cookie", setCookie);

        return ResponseEntity.ok(response);
    }

    @Operation(summary = "Logout from current session")
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest servletRequest,
                                                      HttpServletResponse servletResponse) {
        // Read cookie
        String refreshToken = null;
        if (servletRequest.getCookies() != null) {
            for (Cookie c : servletRequest.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "No refresh token"));
        }

        authService.logout(refreshToken);

        // Clear cookie
        String clearCookie = createRefreshCookieHeader(null);
        servletResponse.addHeader("Set-Cookie", clearCookie);

        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    @Operation(summary = "Logout from all sessions")
    @PostMapping("/logout-all")
    public ResponseEntity<Map<String, String>> logoutAll(HttpServletRequest servletRequest,
                                                         HttpServletResponse servletResponse) {
        // Read cookie
        String refreshToken = null;
        if (servletRequest.getCookies() != null) {
            for (Cookie c : servletRequest.getCookies()) {
                if (REFRESH_COOKIE_NAME.equals(c.getName())) {
                    refreshToken = c.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(401).body(Map.of("message", "No refresh token"));
        }

        UUID authenticatedUserId = SecurityUtils.getCurrentUserId(); 
        authService.logoutAll(authenticatedUserId);

        // Clear cookie
        String clearCookie = createRefreshCookieHeader(null);
        servletResponse.addHeader("Set-Cookie", clearCookie);
        
        return ResponseEntity.ok(Map.of("message","Logged out from all sessions successfully"));
    }
}