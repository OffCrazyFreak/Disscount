package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.domain.PhotoCleanup;
import disscount.digitalCard.storage.PhotoStore;

@Service
@RequiredArgsConstructor
public class PhotoCleanupService {

    private static final int BATCH = 200;

    private static final Logger log = LoggerFactory.getLogger(PhotoCleanupService.class);

    private final PhotoCleanupRepository repository;
    private final PhotoStore photoStore;

    /** Joins the caller's transaction, so the queue row commits or rolls back with the row delete. */
    public void enqueueKey(String key) {
        enqueue(key, false);
    }

    public void enqueuePrefix(String prefix) {
        enqueue(prefix, true);
    }

    /** Scheduled sweep for rows whose first attempt failed or never ran (crash, storage outage). */
    public void retryPending() {
        if (!photoStore.enabled()) return;
        repository.findOldest(PageRequest.of(0, BATCH)).forEach(this::attempt);
    }

    private void enqueue(String keyOrPrefix, boolean prefix) {
        PhotoCleanup row = repository.save(PhotoCleanup.builder().keyOrPrefix(keyOrPrefix).prefix(prefix).build());
        AfterCommit.run(() -> attempt(row));
    }

    private void attempt(PhotoCleanup row) {
        // Without storage nothing was deleted, so the row must stay for when it is configured.
        if (!photoStore.enabled()) return;

        try {
            if (row.isPrefix()) {
                photoStore.deletePrefix(row.getKeyOrPrefix());
            } else {
                photoStore.delete(row.getKeyOrPrefix());
            }
            repository.removeById(row.getId());
        } catch (RuntimeException e) {
            log.warn("Photo cleanup will be retried: {}", e.getMessage());
        }
    }
}
