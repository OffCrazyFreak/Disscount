package disscount.contactMessage.service;

import disscount.contactMessage.dao.ContactMessageRepository;
import disscount.contactMessage.domain.ContactMessage;
import disscount.contactMessage.dto.ContactMessageDto;
import disscount.contactMessage.dto.ContactMessageRequest;
import disscount.exceptions.BadRequestException;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;
import disscount.user.service.UserService;
import disscount.util.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional
public class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final UserRepository userRepository;
    private final UserService userService;

    /** Public: create a message. Silently drops honeypot-filled bot submissions. */
    public ContactMessageDto create(ContactMessageRequest request) {
        if (StringUtils.hasText(request.getHoneypot())) {
            return null;
        }

        User sender = SecurityUtils.getCurrentUserIdOptional()
                .flatMap(userRepository::findById)
                .orElse(null);

        ContactMessage message = ContactMessage.builder()
                .sender(sender)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .subject(request.getSubject())
                .message(request.getMessage())
                .sourcePath(request.getSourcePath())
                .build();

        return convertToDto(contactMessageRepository.save(message));
    }

    public List<ContactMessageDto> list(boolean includeDeleted) {
        requireAdmin();
        List<ContactMessage> messages = includeDeleted
                ? contactMessageRepository.findAllByOrderByCreatedAtDesc()
                : contactMessageRepository.findByDeletedAtIsNullOrderByCreatedAtDesc();
        return messages.stream().map(this::convertToDto).toList();
    }

    public ContactMessageDto getById(UUID id) {
        requireAdmin();
        return convertToDto(loadOrThrow(id));
    }

    public ContactMessageDto markRead(UUID id) {
        return mutate(id, msg -> msg.setReadAt(LocalDateTime.now()));
    }

    public ContactMessageDto markUnread(UUID id) {
        return mutate(id, msg -> msg.setReadAt(null));
    }

    public ContactMessageDto softDelete(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(LocalDateTime.now()));
    }

    public ContactMessageDto restore(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(null));
    }

    private ContactMessageDto mutate(UUID id, Consumer<ContactMessage> change) {
        requireAdmin();
        ContactMessage message = loadOrThrow(id);
        change.accept(message);
        return convertToDto(contactMessageRepository.save(message));
    }

    private ContactMessage loadOrThrow(UUID id) {
        return contactMessageRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Contact message not found"));
    }

    private void requireAdmin() {
        userService.requireAdmin(SecurityUtils.getCurrentUserId());
    }

    private ContactMessageDto convertToDto(ContactMessage message) {
        return ContactMessageDto.builder()
                .id(message.getId())
                .userId(message.getSender() != null ? message.getSender().getId() : null)
                .email(message.getEmail())
                .fullName(message.getFullName())
                .subject(message.getSubject())
                .message(message.getMessage())
                .sourcePath(message.getSourcePath())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .updatedAt(message.getUpdatedAt())
                .deletedAt(message.getDeletedAt())
                .build();
    }
}
