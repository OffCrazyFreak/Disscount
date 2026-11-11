package disscount.contact;

import disscount.shared.NotFoundException;
import disscount.shared.Timestamps;
import disscount.user.AccountErased;
import disscount.user.ActiveUsers;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ContactMessageService {

    private final ContactMessageRepository contactMessageRepository;
    private final ActiveUsers activeUsers;

    // Bounds the admin list query; a full paginated UI is a possible follow-up.
    private static final int MAX_ADMIN_MESSAGES = 500;

    @Transactional
    public Optional<ContactMessageDto> create(ContactMessageRequest request, UUID callerId) {
        // Browsers send the hidden field empty; any character a bot puts there, whitespace included, is a hit.
        if (StringUtils.hasLength(request.honeypot())) {
            return Optional.empty();
        }

        // Locked until the insert commits, so an erasure that wins first leaves this a signed-out message it cannot miss.
        UUID senderId = callerId != null && activeUsers.lockIfActive(callerId) ? callerId : null;

        ContactMessage message = ContactMessage.builder()
                .senderId(senderId)
                .email(request.email())
                .fullName(request.fullName())
                .subject(request.subject())
                .message(request.message())
                .sourcePath(request.sourcePath())
                .build();

        return Optional.of(ContactMessageDto.from(contactMessageRepository.save(message)));
    }

    public List<ContactMessageDto> list(boolean includeDeleted) {
        List<ContactMessage> messages = includeDeleted
                ? contactMessageRepository.findIncludingDeletedNewestFirst(MAX_ADMIN_MESSAGES)
                : contactMessageRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, MAX_ADMIN_MESSAGES));
        return messages.stream().map(ContactMessageDto::from).toList();
    }

    public ContactMessageDto getById(UUID id) {
        return ContactMessageDto.from(loadOrThrow(id));
    }

    @Transactional
    public ContactMessageDto markRead(UUID id) {
        return mutate(id, msg -> msg.setReadAt(Timestamps.nowUtc()));
    }

    @Transactional
    public ContactMessageDto markUnread(UUID id) {
        return mutate(id, msg -> msg.setReadAt(null));
    }

    @Transactional
    public ContactMessageDto softDelete(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(Timestamps.nowUtc()));
    }

    @Transactional
    public ContactMessageDto restore(UUID id) {
        return mutate(id, msg -> msg.setDeletedAt(null));
    }

    /** The name and address go with the account; the text stays for the admins (owner, 2026-11-11). */
    @EventListener
    @Order(60)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        contactMessageRepository.blankSender(erased.userId(), erased.loginEmail());
    }

    private ContactMessageDto mutate(UUID id, Consumer<ContactMessage> change) {
        ContactMessage message = loadOrThrow(id);
        change.accept(message);
        return ContactMessageDto.from(contactMessageRepository.save(message));
    }

    private ContactMessage loadOrThrow(UUID id) {
        return contactMessageRepository.findIncludingDeletedById(id)
                .orElseThrow(() -> new NotFoundException("error.contactMessage.notFound"));
    }
}
