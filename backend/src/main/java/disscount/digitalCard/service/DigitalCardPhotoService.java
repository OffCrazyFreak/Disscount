package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
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
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DigitalCardPhotoService {

    public static final String SLOT_FRONT = "front";
    public static final String SLOT_BACK = "back";
    public static final String SLOT_ICON = "icon";
    private static final Set<String> SLOTS = Set.of(SLOT_FRONT, SLOT_BACK, SLOT_ICON);

    private final DigitalCardRepository cardRepository;
    private final DigitalCardPhotoRepository photoRepository;
    private final PhotoStore photoStore;
    private final PhotoValidator validator;
    private final PhotoUploadRateLimiter rateLimiter;

    /** The bytes handed to a controller for streaming; {@code thumb} picks the small variant. */
    public record PhotoStream(StoredPhoto photo, String sha256, boolean thumb) {}

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

        DigitalCard card = requireCard(userId, cardId);
        ValidatedPhoto fullPhoto = validator.validate(read(full));
        ValidatedPhoto thumbPhoto = needsThumb ? validator.validate(read(thumb)) : null;

        String sha256 = sha256Hex(fullPhoto.bytes());
        String fullKey = PhotoKeys.fullKey(userId, cardId, slot, sha256, fullPhoto.extension());
        String thumbKey = thumbPhoto == null ? null
                : PhotoKeys.thumbKey(userId, cardId, slot, sha256, thumbPhoto.extension());

        photoStore.put(fullKey, fullPhoto.bytes(), fullPhoto.contentType());
        if (thumbPhoto != null) {
            photoStore.put(thumbKey, thumbPhoto.bytes(), thumbPhoto.contentType());
        }

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot).orElse(null);
        String oldFullKey = null;
        String oldThumbKey = null;
        if (row == null) {
            row = DigitalCardPhoto.builder().card(card).slot(slot).build();
        } else {
            oldFullKey = row.getFullKey();
            oldThumbKey = row.getThumbKey();
        }

        row.setSha256(sha256);
        row.setFullKey(fullKey);
        row.setThumbKey(thumbKey);
        row.setContentType(fullPhoto.contentType());
        row.setByteSize(fullPhoto.bytes().length);
        photoRepository.save(row);

        deleteReplaced(oldFullKey, fullKey);
        deleteReplaced(oldThumbKey, thumbKey);

        return new CardPhotoDto(slot, sha256);
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
        requireCard(userId, cardId);

        DigitalCardPhoto row = photoRepository.findByCardIdAndSlot(cardId, slot)
                .orElseThrow(() -> new NotFoundException("Slika nije pronađena"));
        photoRepository.delete(row);

        deleteReplaced(row.getFullKey(), null);
        deleteReplaced(row.getThumbKey(), null);
    }

    private void deleteReplaced(String oldKey, String newKey) {
        if (oldKey != null && !oldKey.equals(newKey)) {
            AfterCommit.run(() -> photoStore.delete(oldKey));
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
