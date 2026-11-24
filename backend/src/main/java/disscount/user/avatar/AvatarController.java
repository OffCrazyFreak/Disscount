package disscount.user.avatar;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import disscount.shared.CurrentUser;
import disscount.user.UserDto;
import disscount.user.UserService;

import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/avatar")
@RequiredArgsConstructor
@Tag(name = "User Management", description = "User management endpoints")
class AvatarController {

    private final AvatarService avatarService;
    private final UserService userService;

    @Operation(summary = "Upload or replace the current user's avatar (multipart part file, WebP or JPEG)")
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserDto> upload(@CurrentUser UUID userId, @RequestPart("file") MultipartFile file) {
        avatarService.upload(userId, file);
        return currentProfile(userId);
    }

    @Operation(summary = "Remove the current user's avatar")
    @DeleteMapping
    public ResponseEntity<UserDto> remove(@CurrentUser UUID userId) {
        avatarService.remove(userId);
        return currentProfile(userId);
    }

    private ResponseEntity<UserDto> currentProfile(UUID userId) {
        return userService.findById(userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
