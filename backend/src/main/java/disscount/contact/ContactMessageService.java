package disscount.contact;

import disscount.shared.NotFoundException;
import disscount.shared.SecurityUtils;
import disscount.shared.Timestamps;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional
class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final ActiveUsers activeUsers;

    // Bounds the admin list query; a full paginated UI is a possible follow-up.
    private static final int MAX_ADMIN_MESSAGES = 500;

    public Optional<ContactMessageDto> create(ContactMessageRequest request) {
        // Browsers send the hidden field empty; any character a bot puts there, whitespace included, is a hit.
        if (StringUtils.hasLength(request.getHoneypot())) {
            return Optional.empty();
        }

        UUID senderId = SecurityUtils.getCurrentUserIdOptional()
                .filter(activeUsers::isActive)
                .orElse(null);

        ContactMessage message = ContactMessage.builder()
                .senderId(senderId)
                .email(request.getEmail())
                .fullName(request.getFullName())
                .subject(request.getSubject())
                .message(request.getMessage())
                .sourcePath(request.getSourcePath())
                .build();

        return Optional.of(convertToDto(contactMessageRepository.save(message)));
    }

    public List<ContactMessageDto> list(boolean includeDeleted) {
        Pageable pageable = PageRequest.of(0, MAX_ADMIN_MESSAGES);
        List<ContactMessage> messages = includeDeleted
                ? contactMessageRepository.findAllByOrderByCreatedAtDesc(pageable)
                : contactMessageRepository.findByDeletedAtIsNullOrderByCreatedAtDesc(pageable);
        return messages.stream().map(this::convertToDto).toList();
    }

    public ContactMessageDto getById(UUID id) {
        return convertToDto(loadOrThrow(id));
    }

    public ContactMessageDto markRead(UUID id) {
        return mutate(id, msg -> msg.setReadAt(Timestamps.nowUtc()));
    }

    public ContactMessageDto markUnread(UUID id) {
        return mutate(id, msg -> msg.setReadAt(null));
    }

    public ContactMessageDto softDelete(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(Timestamps.nowUtc()));
    }

    public ContactMessageDto restore(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(null));
    }

    private ContactMessageDto mutate(UUID id, Consumer<ContactMessage> change) {
        ContactMessage message = loadOrThrow(id);
        change.accept(message);
        return convertToDto(contactMessageRepository.save(message));
    }

    private ContactMessage loadOrThrow(UUID id) {
        return contactMessageRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("error.contactMessage.notFound"));
    }

    private ContactMessageDto convertToDto(ContactMessage message) {
        return ContactMessageDto.builder()
                .id(message.getId())
                .userId(message.getSenderId())
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
