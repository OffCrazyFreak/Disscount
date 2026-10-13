package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Objects;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.PhotoCleanupRepository;
import disscount.digitalCard.domain.PhotoCleanup;
import disscount.digitalCard.storage.PhotoStore;

@Service
@RequiredArgsConstructor
public class PhotoCleanupService {

    private static final int BATCH = 200;

    private static final Logger log = LoggerFactory.getLogger(PhotoCleanupService.class);

    private final PhotoCleanupRepository repository;
    private final DigitalCardPhotoRepository photoRepository;
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

    /** A re-uploaded photo reuses its content addressed keys, so a queued delete of them must not fire. */
    public void cancelKeys(Collection<String> keys) {
        List<String> real = keys.stream().filter(Objects::nonNull).toList();
        if (!real.isEmpty()) repository.removePendingKeys(real);
    }

    private void enqueue(String keyOrPrefix, boolean prefix) {
        PhotoCleanup row = repository.save(PhotoCleanup.builder().keyOrPrefix(keyOrPrefix).prefix(prefix).build());
        AfterCommit.run(() -> attempt(row));
    }

    private void attempt(PhotoCleanup row) {
        // Without storage nothing was deleted, so the row must stay for when it is configured.
        if (!photoStore.enabled()) return;

        try {
            // Last line of defence if a cancel lost a race: a key a live row points at is never deleted.
            if (!row.isPrefix() && photoRepository.isKeyReferenced(row.getKeyOrPrefix())) {
                repository.removeById(row.getId());
                return;
            }

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
