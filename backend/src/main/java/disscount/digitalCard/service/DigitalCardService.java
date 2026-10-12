package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.digitalCard.dao.DigitalCardPhotoRepository;
import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.domain.DigitalCard;
import disscount.digitalCard.domain.DigitalCardPhoto;
import disscount.digitalCard.dto.CardUsedEntry;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.digitalCard.storage.PhotoStore;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.ConflictException;
import disscount.exceptions.NotFoundException;
import disscount.storeName.service.StoreNameNormalizer;
import disscount.storeName.service.StoreNameService;
import disscount.user.domain.User;
import disscount.util.Timestamps;

import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DigitalCardService {

    static final int MAX_ACTIVE_CARDS = 300;
    static final int MAX_USED_ENTRIES = 50;
    static final int MAX_USED_AGE_DAYS = 400;

    private static final Logger log = LoggerFactory.getLogger(DigitalCardService.class);
    private static final String NOT_FOUND = "Kartica nije pronađena";

    private final DigitalCardRepository cardRepository;
    private final DigitalCardPhotoRepository photoRepository;
    private final CardUserLock userLock;
    private final StoreNameService storeNameService;
    private final PhotoCleanupService cleanup;
    private final PhotoStore photoStore;
    private final DigitalCardMapper mapper;

    @Transactional(readOnly = true)
    public List<DigitalCardDto> list(UUID userId) {
        List<DigitalCard> cards = cardRepository.findActiveByUserId(userId);
        if (cards.isEmpty()) return List.of();

        Map<UUID, List<DigitalCardPhoto>> photosByCard = photoRepository
                .findByCardIdIn(cards.stream().map(DigitalCard::getId).toList())
                .stream()
                .collect(Collectors.groupingBy(p -> p.getCard().getId()));

        return cards.stream()
                .map(card -> mapper.toDto(card, photosByCard.getOrDefault(card.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public DigitalCardDto get(UUID userId, UUID id) {
        return toDto(requireActive(userId, id));
    }

    @Transactional(readOnly = true)
    public boolean photosEnabled() {
        return photoStore.enabled();
    }

    /**
     * Idempotent create-or-update. The three outcomes are explicit rather than left to save():
     * a replayed create after a delete must never resurrect the card, and another user's id
     * must look exactly like an unused one. The user lock makes the cap check and the insert
     * atomic and turns a concurrent replay of the same id into a plain update.
     */
    public DigitalCardDto upsert(UUID userId, UUID id, DigitalCardRequest request) {
        User user = userLock.acquire(userId);
        DigitalCard card = cardRepository.findById(id).orElse(null);
        boolean created = card == null;
        String previousStore = created ? null : card.getStoreName();
        String previousChain = created ? null : card.getChainCode();

        if (created) {
            if (cardRepository.countActiveByUserId(userId) >= MAX_ACTIVE_CARDS) {
                throw new ConflictException("Dosegnut je najveći broj kartica");
            }
            card = DigitalCard.builder().id(id).user(user).build();
        } else if (!card.getUser().getId().equals(userId) || card.getDeletedAt() != null) {
            throw new NotFoundException(NOT_FOUND);
        }

        apply(card, request);
        card = cardRepository.save(card);

        // Only a new custom name counts as a use, so edits and replays cannot inflate a suggestion.
        if (card.getChainCode() == null
                && (created || previousChain != null || !sameStore(previousStore, card.getStoreName()))) {
            String storeName = card.getStoreName();
            AfterCommit.run(() -> recordStoreName(storeName));
        }

        return toDto(card);
    }

    public DigitalCardDto setPinned(UUID userId, UUID id, boolean pinned) {
        DigitalCard card = requireActive(userId, id);
        card.setPinnedAt(pinned ? Timestamps.nowUtc() : null);
        return toDto(cardRepository.save(card));
    }

    public DigitalCardDto setArchived(UUID userId, UUID id, boolean archived) {
        DigitalCard card = requireActive(userId, id);
        card.setArchivedAt(archived ? Timestamps.nowUtc() : null);
        return toDto(cardRepository.save(card));
    }

    public void delete(UUID userId, UUID id) {
        userLock.acquire(userId);
        DigitalCard card = requireActive(userId, id);

        // Photos are personal data, so they go now rather than with the 30 day purge.
        photoRepository.deleteAllByCardId(id);
        cleanup.enqueuePrefix(PhotoKeys.cardPrefix(userId, id));

        card.setDeletedAt(Timestamps.nowUtc());
        cardRepository.save(card);
    }

    public void recordUsed(UUID userId, List<CardUsedEntry> entries) {
        if (entries == null || entries.isEmpty() || entries.size() > MAX_USED_ENTRIES) {
            throw new BadRequestException("Pošalji od 1 do " + MAX_USED_ENTRIES + " kartica odjednom");
        }

        LocalDateTime now = Timestamps.nowUtc();
        LocalDateTime oldest = now.minusDays(MAX_USED_AGE_DAYS);
        for (CardUsedEntry entry : entries) {
            if (entry == null || entry.getId() == null || entry.getUsedAt() == null) {
                throw new BadRequestException("Svaki unos mora imati id i vrijeme");
            }
            // Clamped both ways so a skewed device clock cannot pin a card to the future or the distant past of every sort.
            LocalDateTime usedAt = toUtc(entry.getUsedAt());
            if (usedAt.isAfter(now)) usedAt = now;
            if (usedAt.isBefore(oldest)) usedAt = oldest;
            cardRepository.touchLastUsed(entry.getId(), userId, usedAt);
        }
    }

    /** Account deletion: nothing of the user's cards may outlive the profile. */
    public void deleteAllForUser(UUID userId) {
        photoRepository.deleteAllByUserId(userId);
        cardRepository.deleteAllByUserId(userId);
        cleanup.enqueuePrefix(PhotoKeys.userPrefix(userId));
    }

    /** Hard deletes cards soft deleted before the cutoff; returns how many went. */
    public int purgeDeletedBefore(LocalDateTime cutoff) {
        List<DigitalCard> stale = cardRepository.findDeletedBefore(cutoff);
        for (DigitalCard card : stale) {
            UUID cardId = card.getId();
            String prefix = PhotoKeys.cardPrefix(card.getUser().getId(), cardId);
            photoRepository.deleteAllByCardId(cardId);
            cleanup.enqueuePrefix(prefix);
        }
        cardRepository.deleteAll(stale);
        return stale.size();
    }

    private void apply(DigitalCard card, DigitalCardRequest r) {
        card.setCardName(r.getCardName().trim());
        card.setStoreName(r.getStoreName().trim());
        card.setCardType(r.getCardType());
        card.setChainCode(r.getChainCode());
        card.setCodeValue(r.getCodeValue().trim());
        card.setBarcodeValue(blankToNull(r.getBarcodeValue()));
        card.setCodeType(r.getCodeType());
        card.setCardColor(r.getCardColor());
        card.setNote(blankToNull(r.getNote()));
        card.setValidFrom(r.getValidFrom());
        card.setExpiresOn(r.getExpiresOn());
        card.setBalance(r.getBalance() == null ? null : r.getBalance().setScale(2, RoundingMode.UNNECESSARY));
        // A unit without an amount means nothing, and null unit means points.
        card.setBalanceUnit(r.getBalance() == null ? null : r.getBalanceUnit());
    }

    private void recordStoreName(String storeName) {
        try {
            storeNameService.record(storeName);
        } catch (RuntimeException e) {
            // A suggestion is a nicety; it must never fail the card save.
            log.warn("Could not record store name suggestion: {}", e.getMessage());
        }
    }

    private DigitalCard requireActive(UUID userId, UUID id) {
        return cardRepository.findActiveByIdAndUserId(id, userId)
                .orElseThrow(() -> new NotFoundException(NOT_FOUND));
    }

    private DigitalCardDto toDto(DigitalCard card) {
        return mapper.toDto(card, photoRepository.findByCardId(card.getId()));
    }

    private static boolean sameStore(String before, String after) {
        return StoreNameNormalizer.normalize(before).equals(StoreNameNormalizer.normalize(after));
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static LocalDateTime toUtc(Instant instant) {
        return LocalDateTime.ofInstant(instant, ZoneOffset.UTC);
    }
}
