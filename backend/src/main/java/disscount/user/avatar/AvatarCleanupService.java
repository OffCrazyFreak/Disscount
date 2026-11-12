package disscount.user.avatar;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

import disscount.shared.AfterCommit;
import disscount.shared.photo.PhotoStore;
import disscount.shared.photo.PhotoStoreConfig;
import disscount.user.UserRepository;

/** The card photo outbox's pattern for avatar files: queued with the profile change, deleted after it commits. */
@Service
@RequiredArgsConstructor
class AvatarCleanupService {

    private static final int BATCH = 200;

    private static final Logger log = LoggerFactory.getLogger(AvatarCleanupService.class);

    private final AvatarCleanupRepository repository;
    private final UserRepository users;
    @Qualifier(PhotoStoreConfig.AVATARS)
    private final PhotoStore store;

    /** Joins the caller's transaction, so the queue row commits or rolls back with the profile change. */
    void enqueueKey(String key) {
        enqueue(key, false);
    }

    /** Always queued, even with storage off: an erased account must reach every file once it is back. */
    void enqueueErasure(String prefix) {
        enqueue(prefix, true);
    }

    /** Scheduled sweep for rows whose first attempt failed or never ran (crash, storage outage); tries each row once. */
    void retryPending() {
        if (!store.enabled()) return;

        List<AvatarCleanup> page = repository.findOldest(PageRequest.of(0, BATCH));
        while (!page.isEmpty()) {
            page.forEach(this::attempt);

            AvatarCleanup last = page.getLast();
            page = repository.findOldestAfter(last.getCreatedAt(), last.getId(), PageRequest.of(0, BATCH));
        }
    }

    private void enqueue(String keyOrPrefix, boolean prefix) {
        AvatarCleanup row = repository.save(AvatarCleanup.builder().keyOrPrefix(keyOrPrefix).prefix(prefix).build());
        AfterCommit.run(() -> attempt(row));
    }

    private void attempt(AvatarCleanup row) {
        // Without storage nothing was deleted, so the row must stay for when it is configured.
        if (!store.enabled()) return;

        try {
            // A key the profile points at again is never deleted.
            if (!row.isPrefix() && users.existsByAvatarKey(row.getKeyOrPrefix())) {
                repository.removeById(row.getId());
                return;
            }

            if (row.isPrefix()) {
                store.deletePrefix(row.getKeyOrPrefix());
            } else {
                store.delete(row.getKeyOrPrefix());
            }
            repository.removeById(row.getId());
        } catch (RuntimeException e) {
            log.warn("Avatar cleanup will be retried: {}", e.getMessage());
        }
    }
}
