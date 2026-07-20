package disscount.contactMessage.rest;

import disscount.contactMessage.dto.ContactMessageDto;
import disscount.contactMessage.dto.ContactMessageRequest;
import disscount.contactMessage.service.ContactMessageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Public contact form submissions")
public class ContactMessageController {

    private final ContactMessageService contactMessageService;

    @Operation(summary = "Submit a contact message (public)")
    @PostMapping
    public ResponseEntity<ContactMessageDto> create(@Valid @RequestBody ContactMessageRequest request) {
        return ResponseEntity.ok(contactMessageService.create(request));
    }
}
