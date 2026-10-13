package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.domain.DigitalCard;
import disscount.digitalCard.domain.DigitalCardPhoto;
import disscount.digitalCard.dto.CardPhotoDto;
import disscount.digitalCard.photo.PhotoValidator;
import disscount.digitalCard.photo.ValidatedPhoto;
import disscount.digitalCard.storage.PhotoStore;
import disscount.digitalCard.storage.StoredPhoto;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.NotFoundException;
import disscount.exceptions.ServiceUnavailableException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DigitalCardPhotoService {

    private static final Logger log = LoggerFactory.getLogger(DigitalCardPhotoService.class);

    public static final String SLOT_FRONT = "front";
    public static final String SLOT_BACK = "back";
    public static final String SLOT_ICON = "icon";
    private static final Set<String> SLOTS = Set.of(SLOT_FRONT, SLOT_BACK, SLOT_ICON);

    private final DigitalCardRepository cardRepository;
    private final DigitalCardPhotoRepository photoRepository;
    private final CardPhotoWriter writer;
    private final PhotoStore photoStore;
    private final PhotoValidator validator;
    private final PhotoUploadRateLimiter rateLimiter;

    /** The bytes handed to a controller for streaming; {@code thumb} picks the small variant. */
    public record PhotoStream(StoredPhoto photo, String sha256, boolean thumb) {}

    /**
     * Deliberately not one transaction: the image is validated and stored first, and only the
     * row write is transactional. If that write fails, the objects just stored are removed.
     */
    public CardPhotoDto upload(UUID userId, UUID cardId, String slot, MultipartFile full, MultipartFile thumb) {
        if (!photoStore.enabled()) {
            throw new ServiceUnavailableException("Slike trenutno nisu dostupne");
        }
        requireSlot(slot);
        rateLimiter.check(userId);

        boolean needsThumb = !SLOT_ICON.equals(slot);
        if (needsThumb && (thumb == null || thumb.isEmpty())) {
            throw new BadRequestException("Nedostaje sličica");
        }
        if (!needsThumb && thumb != null && !thumb.isEmpty()) {
            throw new BadRequestException("Ikona nema sličicu");
        }

        // Cheap ownership check before any CPU is spent on someone else's id; the writer repeats it under the lock.
        requireCard(userId, cardId);
        ValidatedPhoto fullPhoto = validator.validate(read(full));
        ValidatedPhoto thumbPhoto = needsThumb ? validator.validate(read(thumb)) : null;

        // Both images feed the hash, so replacing only the thumbnail still changes the key, ETag and ?v=.
        String sha256 = thumbPhoto == null
                ? sha256Hex(fullPhoto.bytes())
                : sha256Hex((sha256Hex(fullPhoto.bytes()) + ":" + sha256Hex(thumbPhoto.bytes()))
                        .getBytes(StandardCharsets.US_ASCII));
        String uploadId = PhotoKeys.newUploadId();
        String fullKey = PhotoKeys.fullKey(userId, cardId, slot, sha256, uploadId, fullPhoto.extension());
        String thumbKey = thumbPhoto == null ? null
                : PhotoKeys.thumbKey(userId, cardId, slot, sha256, uploadId, thumbPhoto.extension());

        try {
            photoStore.put(fullKey, fullPhoto.bytes(), fullPhoto.contentType());
            if (thumbPhoto != null) {
                photoStore.put(thumbKey, thumbPhoto.bytes(), thumbPhoto.contentType());
            }
            return writer.replace(userId, cardId, slot, new CardPhotoWriter.Stored(
                    sha256, fullKey, thumbKey, fullPhoto.contentType(), fullPhoto.bytes().length));
        } catch (RuntimeException e) {
            discardUnreferenced(cardId, slot, fullKey, thumbKey);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public PhotoStream open(UUID userId, UUID cardId, String slot, boolean thumb, String version) {
        requireSlot(slot);
        requireCard(userId, cardId);

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot)
                .orElseThrow(() -> new NotFoundException("Slika nije pronađena"));

        // The URL is cached as immutable, so an old version must 404 instead of serving the new bytes under it.
        if (version != null && !version.equals(row.getSha256())) {
            throw new NotFoundException("Slika nije pronađena");
        }

        String key = thumb ? row.getThumbKey() : row.getFullKey();
        if (key == null) throw new NotFoundException("Slika nije pronađena");

        StoredPhoto stored = photoStore.get(key)
                .orElseThrow(() -> new NotFoundException("Slika nije pronađena"));
        return new PhotoStream(stored, row.getSha256(), thumb);
    }

    @Transactional(readOnly = true)
    public String currentSha256(UUID userId, UUID cardId, String slot) {
        requireSlot(slot);
        requireCard(userId, cardId);
        return photoRepository.findByCardIdAndSlot(cardId, slot)
                .map(DigitalCardPhoto::getSha256)
                .orElseThrow(() -> new NotFoundException("Slika nije pronađena"));
    }

    public void delete(UUID userId, UUID cardId, String slot) {
        requireSlot(slot);
        writer.remove(userId, cardId, slot);
    }

    // Content addressed keys can equal the live row's keys (same bytes uploaded twice), and those must survive.
    private void discardUnreferenced(UUID cardId, String slot, String fullKey, String thumbKey) {
        try {
            DigitalCardPhoto live = photoRepository.findByCardIdAndSlot(cardId, slot).orElse(null);
            for (String key : new String[]{fullKey, thumbKey}) {
                if (key == null) continue;
                boolean referenced = live != null
                        && (key.equals(live.getFullKey()) || key.equals(live.getThumbKey()));
                if (!referenced) photoStore.delete(key);
            }
        } catch (RuntimeException cleanupFailure) {
            log.warn("Could not discard photo objects after a failed write: {}", cleanupFailure.getMessage());
        }
    }

    private DigitalCard requireCard(UUID userId, UUID cardId) {
        return cardRepository.findActiveByIdAndUserId(cardId, userId)
                .orElseThrow(() -> new NotFoundException("Kartica nije pronađena"));
    }

    private static void requireSlot(String slot) {
        if (!SLOTS.contains(slot)) {
            throw new BadRequestException("Nepoznato mjesto za sliku");
        }
    }

    private static byte[] read(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Slika se nije mogla pročitati");
        }
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
