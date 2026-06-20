package disscount.user.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.user.dto.UserDto;
import disscount.user.dto.UserRequest;
import disscount.user.service.UserService;
import disscount.util.SecurityUtils;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints")
public class UserController {

    private final UserService userService;

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
        UserDto updatedUser = userService.updateProfile(
                authenticatedUserId,
                request.getUsername(),
                request.getNotificationsPush(),
                request.getNotificationsEmail(),
                request.getImage()
        );
        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Anonymize and soft-delete current user's profile")
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteCurrentUser() {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        userService.deleteAccount(authenticatedUserId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
