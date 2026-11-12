package disscount.contact;

import disscount.shared.ClientIp;
import disscount.shared.CurrentUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
@Tag(name = "Contact", description = "Public contact form submissions")
class ContactMessageController {

    private final ContactMessageService contactMessageService;
    private final ContactRateLimiter contactRateLimiter;

    @Operation(summary = "Submit a contact message (public)")
    @PostMapping
    public ResponseEntity<ContactMessageDto> create(
            @CurrentUser(required = false) UUID callerId,
            @Valid @RequestBody ContactMessageRequest request,
            HttpServletRequest httpRequest) {
        contactRateLimiter.check(ClientIp.resolve(httpRequest));
        return contactMessageService.create(request, callerId)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}
