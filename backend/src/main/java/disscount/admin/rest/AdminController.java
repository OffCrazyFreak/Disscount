package disscount.admin.rest;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.admin.dto.UpdateAccountTypeRequest;
import disscount.user.dto.UserDto;
import disscount.user.service.UserService;
import disscount.util.SecurityUtils;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only management endpoints")
public class AdminController {

    private final UserService userService;

    @Operation(summary = "List all active users (admin only)")
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        userService.requireAdmin(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(userService.findAllActive());
    }

    @Operation(summary = "Change a user's account type (admin only)")
    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserDto> updateAccountType(
            @PathVariable UUID userId,
            @RequestBody UpdateAccountTypeRequest request
    ) {
        userService.requireAdmin(SecurityUtils.getCurrentUserId());
        return ResponseEntity.ok(userService.updateAccountType(userId, request.getAccountType()));
    }

    @Operation(summary = "Delete a user (admin only)")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable UUID userId) {
        UUID adminUserId = SecurityUtils.getCurrentUserId();
        userService.requireAdmin(adminUserId);
        userService.deleteUserAsAdmin(userId, adminUserId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
