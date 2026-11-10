package disscount.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.SecurityUtils;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints")
public class UserController {

    private final UserService userService;
    private final AccountErasureService accountErasureService;

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser() {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        return userService.findById(authenticatedUserId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update current user's profile (username, notifications)")
    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(@Valid @RequestBody UserRequest request) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        UserDto updatedUser = userService.updateProfile(authenticatedUserId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Erase the current user's app data; only better-auth's account erasure token may call it")
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteCurrentUser() {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        accountErasureService.erase(authenticatedUserId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
