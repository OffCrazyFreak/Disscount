package disscount.contactMessage.rest;

import disscount.contactMessage.dto.ContactMessageDto;
import disscount.contactMessage.service.ContactMessageService;
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

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/contact")
@RequiredArgsConstructor
@Tag(name = "Admin Contact", description = "Admin-only contact message management")
public class AdminContactController {

    private final ContactMessageService contactMessageService;

    @Operation(summary = "List contact messages (admin only)")
    @GetMapping
    public ResponseEntity<List<ContactMessageDto>> list(
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        return ResponseEntity.ok(contactMessageService.list(includeDeleted));
    }

    @Operation(summary = "Get a contact message by ID (admin only)")
    @GetMapping("/{id}")
    public ResponseEntity<ContactMessageDto> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.getById(id));
    }

    @Operation(summary = "Mark as read (admin only)")
    @PatchMapping("/{id}/read")
    public ResponseEntity<ContactMessageDto> markRead(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.markRead(id));
    }

    @Operation(summary = "Mark as unread (admin only)")
    @PatchMapping("/{id}/unread")
    public ResponseEntity<ContactMessageDto> markUnread(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.markUnread(id));
    }

    @Operation(summary = "Archive (admin only)")
    @PatchMapping("/{id}/archive")
    public ResponseEntity<ContactMessageDto> archive(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.archive(id));
    }

    @Operation(summary = "Unarchive (admin only)")
    @PatchMapping("/{id}/unarchive")
    public ResponseEntity<ContactMessageDto> unarchive(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.unarchive(id));
    }

    @Operation(summary = "Soft delete (admin only)")
    @DeleteMapping("/{id}")
    public ResponseEntity<ContactMessageDto> softDelete(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.softDelete(id));
    }

    @Operation(summary = "Restore (admin only)")
    @PatchMapping("/{id}/restore")
    public ResponseEntity<ContactMessageDto> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(contactMessageService.restore(id));
    }
}
