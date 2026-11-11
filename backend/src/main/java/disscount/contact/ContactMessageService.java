package disscount.contact;

import disscount.shared.errors.NotFoundException;
import disscount.shared.Timestamps;
import disscount.user.AccountErased;
import disscount.user.ActiveUsers;
import disscount.user.AdminAction;
import disscount.user.AdminAuditLog;
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
    private final AdminAuditLog adminAudit;

    // Bounds the admin list query; a full paginated UI is a possible follow-up.
    private static final int MAX_ADMIN_MESSAGES = 500;

    @Transactional
    public Optional<ContactMessageDto> create(ContactMessageRequest request, UUID callerId) {
        // Browsers send the hidden field empty; any character a bot puts there, whitespace included, is a hit.
        if (StringUtils.hasLength(request.honeypot())) {
            return Optional.empty();
        }

        // Both locks hold until the insert commits, so the erasure's blanking either sees this row or has already run.
        if (callerId != null) {
            activeUsers.lockActive(callerId);
        }

        boolean fromErasedAccount = callerId == null
                && StringUtils.hasText(request.email())
                && activeUsers.isErasedLoginAddress(request.email());

        ContactMessage message = ContactMessage.builder()
                .senderId(callerId)
                .email(fromErasedAccount ? null : request.email())
                .fullName(fromErasedAccount ? null : request.fullName())
                .subject(request.subject())
                .message(request.message())
                .sourcePath(request.sourcePath())
                .build();

        return Optional.of(ContactMessageDto.from(contactMessageRepository.save(message)));
    }

    // Messages hold senders' emails and words, so every admin read and change lands in the admin audit.
    @Transactional
    public List<ContactMessageDto> list(boolean includeDeleted, UUID adminId) {
        // Its own action, so a read that shows deleted messages is never hidden behind an earlier plain one.
        adminAudit.recordRead(adminId,
                includeDeleted ? AdminAction.READ_CONTACT_LIST_WITH_DELETED : AdminAction.READ_CONTACT_LIST, null);

        List<ContactMessage> messages = includeDeleted
                ? contactMessageRepository.findIncludingDeletedNewestFirst(MAX_ADMIN_MESSAGES)
                : contactMessageRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, MAX_ADMIN_MESSAGES));
        return messages.stream().map(ContactMessageDto::from).toList();
    }

    @Transactional
    public ContactMessageDto getById(UUID id, UUID adminId) {
        ContactMessage message = loadOrThrow(id);
        adminAudit.recordRead(adminId, AdminAction.READ_CONTACT_MESSAGE, id);
        return ContactMessageDto.from(message);
    }

    @Transactional
    public ContactMessageDto markRead(UUID id, UUID adminId) {
        return mutate(id, adminId, AdminAction.MARK_CONTACT_MESSAGE_READ, msg -> msg.setReadAt(Timestamps.nowUtc()));
    }

    @Transactional
    public ContactMessageDto markUnread(UUID id, UUID adminId) {
        return mutate(id, adminId, AdminAction.MARK_CONTACT_MESSAGE_UNREAD, msg -> msg.setReadAt(null));
    }

    @Transactional
    public ContactMessageDto softDelete(UUID id, UUID adminId) {
        return mutate(id, adminId, AdminAction.DELETE_CONTACT_MESSAGE, msg -> msg.setDeletedAt(Timestamps.nowUtc()));
    }

    @Transactional
    public ContactMessageDto restore(UUID id, UUID adminId) {
        return mutate(id, adminId, AdminAction.RESTORE_CONTACT_MESSAGE, msg -> msg.setDeletedAt(null));
    }

    /** The name and address go with the account; the text stays for the admins (owner, 2026-11-11). */
    @EventListener
    @Order(60)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        contactMessageRepository.blankSender(erased.userId(), erased.loginEmail());
    }

    private ContactMessageDto mutate(UUID id, UUID adminId, AdminAction action, Consumer<ContactMessage> change) {
        ContactMessage message = loadOrThrow(id);
        change.accept(message);
        ContactMessageDto saved = ContactMessageDto.from(contactMessageRepository.save(message));

        adminAudit.recordContactChange(adminId, id, action);

        return saved;
    }

    private ContactMessage loadOrThrow(UUID id) {
        return contactMessageRepository.findIncludingDeletedById(id)
                .orElseThrow(() -> new NotFoundException("error.contactMessage.notFound"));
    }
}
