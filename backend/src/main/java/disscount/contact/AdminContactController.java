package disscount.contact;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import disscount.shared.CurrentUser;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/contact")
@RequiredArgsConstructor
@Tag(name = "Admin Contact", description = "Admin-only contact message management")
class AdminContactController {

    private final ContactMessageService contactMessageService;

    @Operation(summary = "List contact messages (admin only)")
    @GetMapping
    public ResponseEntity<List<ContactMessageDto>> list(
            @CurrentUser UUID adminId,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(contactMessageService.list(includeDeleted, adminId));
    }

    @Operation(summary = "Get a contact message by ID (admin only)")
    @GetMapping("/{id}")
    public ResponseEntity<ContactMessageDto> getById(@CurrentUser UUID adminId, @PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.getById(id, adminId));
    }

    @Operation(summary = "Mark as read (admin only)")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ContactMessageDto> markRead(@CurrentUser UUID adminId, @PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.markRead(id, adminId));
    }

    @Operation(summary = "Mark as unread (admin only)")
    @PatchMapping("/{id}/unread")
    public ResponseEntity<ContactMessageDto> markUnread(@CurrentUser UUID adminId, @PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.markUnread(id, adminId));
    }

    @Operation(summary = "Soft delete (admin only)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ContactMessageDto> softDelete(@CurrentUser UUID adminId, @PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.softDelete(id, adminId));
    }

    @Operation(summary = "Restore (admin only)")
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ContactMessageDto> restore(@CurrentUser UUID adminId, @PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.restore(id, adminId));
    }
}
