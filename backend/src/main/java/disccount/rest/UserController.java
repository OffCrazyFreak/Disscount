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

    @Operation(summary = "Get user by ID")
    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable UUID id) {
        // Only allow users to get their own profile
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        if (authenticatedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!authenticatedUserId.equals(id)) {
            return ResponseEntity.status(403).build();
        }
        
        return userService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @Operation(summary = "Get all users")
    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers() {
        List<UserDto> users = userService.findAll();
        return ResponseEntity.ok(users);
    }

    @Operation(summary = "Patch user profile (username, stayLoggedInDays, notifications)")
    @PatchMapping("/{id}")
    public ResponseEntity<UserDto> updateProfile(
            @PathVariable UUID id,
            @RequestBody UpdateUserRequest request) {

        // Get the authenticated user ID from Spring Security context
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        if (authenticatedUserId == null) {
            return ResponseEntity.status(401).build();
        }

        // Ensure the authenticated user can only update their own profile
        if (!authenticatedUserId.equals(id)) {
            return ResponseEntity.status(403).build();
        }

        UserDto updatedUser = userService.updateProfile(
                id,
                request.getUsername(),
                request.getStayLoggedInDays(),
                request.getNotificationsPush(),
                request.getNotificationsEmail()
        );

        return ResponseEntity.ok(updatedUser);
    }

    @Operation(summary = "Soft delete user")
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID id) {
        // Only allow users to delete their own account
        UUID authenticatedUserId = SecurityUtils.getCurrentUserId();
        if (authenticatedUserId == null) {
            return ResponseEntity.status(401).build();
        }
        
        if (!authenticatedUserId.equals(id)) {
            return ResponseEntity.status(403).build();
        }
        
        userService.softDeleteUser(id);
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
