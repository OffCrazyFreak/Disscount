package disscount.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.CurrentUser;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints")
class UserController {

    private final UserService userService;
    private final AccountErasureService accountErasureService;

    @Operation(summary = "Get current authenticated user")
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(@CurrentUser UUID authenticatedUserId) {
        return userService.findById(authenticatedUserId)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Update current user's profile (username, notifications)")
    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(
            @CurrentUser UUID authenticatedUserId,
            @Valid @RequestBody UserRequest request) {
        UserDto updatedUser = userService.updateProfile(authenticatedUserId, request);
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Erase the current user's app data; only better-auth's account erasure token may call it")
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteCurrentUser(@CurrentUser UUID authenticatedUserId) {
        accountErasureService.eraseOwnAccount(authenticatedUserId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
