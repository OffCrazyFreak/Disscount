package disccount.rest;

import disccount.dto.auth.UserDto;
import disccount.dto.auth.UpdateUserRequest;
import disccount.service.UserService;
import disccount.util.SecurityUtils;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @Operation(summary = "Get all users")
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Patch current user's profile (username, stayLoggedInDays, notifications)")
    @PatchMapping("/me")
    public ResponseEntity<UserDto> updateCurrentUser(
            @RequestBody UpdateUserRequest request) {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();

        UserDto updatedUser = userService.updateProfile(
                authenticatedUserId,
                request.getUsername(),
                request.getStayLoggedInDays(),
                request.getNotificationsPush(),
                request.getNotificationsEmail()
        );

        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Soft delete current user")
    @DeleteMapping("/me")
    public ResponseEntity<Map<String, String>> deleteCurrentUser() {
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();

        userService.softDeleteUser(authenticatedUserId);
        
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }


    @Operation(summary = "Check if email exists")
    @GetMapping("/exists/email/{email}")
    public ResponseEntity<Map<String, Boolean>> checkEmailExists(@PathVariable String email) {
        boolean exists = userService.existsByEmail(email);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    @Operation(summary = "Check if username exists")
    @GetMapping("/exists/username/{username}")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(@PathVariable String username) {
        boolean exists = userService.existsByUsername(username);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
