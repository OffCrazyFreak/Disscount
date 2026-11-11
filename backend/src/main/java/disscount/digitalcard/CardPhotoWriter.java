package disscount.digitalcard;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import disscount.shared.NotFoundException;

import java.util.Arrays;
import java.util.UUID;

/** No transaction or pooled connection is held while the image is re-encoded or written to disk. */
@Component
@RequiredArgsConstructor
public class CardPhotoWriter {

    /** The objects already stored for a photo; {@code thumbKey} is null for the icon slot. */
    public record Stored(String sha256, String fullKey, String thumbKey, String contentType, int byteSize) {}

    private final DigitalCardRepository cardRepository;
    private final DigitalCardPhotoRepository photoRepository;
    private final CardUserLock userLock;
    private final PhotoCleanupService cleanup;

    @Transactional
    public CardPhotoDto replace(UUID userId, UUID cardId, String slot, Stored stored) {
        userLock.acquire(userId);
        // Checked under the lock: a delete that committed while the bytes were uploading must win.
        DigitalCard card = requireActive(userId, cardId);

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot).orElse(null);
        String oldFullKey = null;
        String oldThumbKey = null;
        if (row == null) {
            row = DigitalCardPhoto.builder().card(card).slot(slot).build();
        } else {
            oldFullKey = row.getFullKey();
            oldThumbKey = row.getThumbKey();
        }

        row.setSha256(stored.sha256());
        row.setFullKey(stored.fullKey());
        row.setThumbKey(stored.thumbKey());
        row.setContentType(stored.contentType());
        row.setByteSize(stored.byteSize());
        photoRepository.save(row);
        cleanup.cancelKeys(Arrays.asList(stored.fullKey(), stored.thumbKey()));

        enqueueIfReplaced(oldFullKey, stored.fullKey());
        enqueueIfReplaced(oldThumbKey, stored.thumbKey());

        return new CardPhotoDto(slot, stored.sha256());
    }

    @Transactional
    public void remove(UUID userId, UUID cardId, String slot) {
        userLock.acquire(userId);
        requireActive(userId, cardId);

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot)
                .orElseThrow(() -> new NotFoundException("error.cardPhoto.notFound"));
        photoRepository.delete(row);

        enqueueIfReplaced(row.getFullKey(), null);
        enqueueIfReplaced(row.getThumbKey(), null);
    }

    private void enqueueIfReplaced(String oldKey, String newKey) {
        if (oldKey != null && !oldKey.equals(newKey)) {
            cleanup.enqueueKey(oldKey);
        }
    }

    private DigitalCard requireActive(UUID userId, UUID cardId) {
        return cardRepository.findActiveByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new NotFoundException("error.card.notFound"));
    }
}
