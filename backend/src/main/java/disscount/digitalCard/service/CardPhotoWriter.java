package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.domain.DigitalCard;
import disscount.digitalCard.domain.DigitalCardPhoto;
import disscount.digitalCard.dto.CardPhotoDto;
import disscount.exceptions.NotFoundException;

import java.util.UUID;

/**
 * The short database half of a photo write. Validation and object storage happen before it, so
 * no transaction (and no pooled connection) is held while the image is re-encoded or sent to R2.
 */
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

        enqueueIfReplaced(oldFullKey, stored.fullKey());
        enqueueIfReplaced(oldThumbKey, stored.thumbKey());

        return new CardPhotoDto(slot, stored.sha256());
    }

    @Transactional
    public void remove(UUID userId, UUID cardId, String slot) {
        userLock.acquire(userId);
        requireActive(userId, cardId);

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot)
                .orElseThrow(() -> new NotFoundException("Slika nije pronađena"));
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
                .orElseThrow(() -> new NotFoundException("Kartica nije pronađena"));
    }
}
