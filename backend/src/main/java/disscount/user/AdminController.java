package disscount.user;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import disscount.shared.CurrentUser;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Tag(name = "Admin", description = "Admin-only management endpoints")
class AdminController {

    private final UserService userService;

    @Operation(summary = "List all active users (admin only)")
    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(userService.findAllActive());
    }

    @Operation(summary = "Change a user's account type (admin only)")
    @PatchMapping("/users/{userId}")
    public ResponseEntity<UserDto> updateAccountType(
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateAccountTypeRequest request
    ) {
        return ResponseEntity.ok(userService.updateAccountType(userId, request.accountType()));
    }

    @Operation(summary = "Delete a user (admin only)")
    @DeleteMapping("/users/{userId}")
    public ResponseEntity<Map<String, String>> deleteUser(@CurrentUser UUID adminId, @PathVariable UUID userId) {
        userService.deleteUserAsAdmin(userId, adminId);
        return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
    }
}
