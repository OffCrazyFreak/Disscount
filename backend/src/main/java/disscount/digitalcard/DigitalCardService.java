package disscount.digitalcard;

import disscount.shared.AfterCommit;
import disscount.shared.BadRequestException;
import disscount.shared.ConflictException;
import disscount.shared.NotFoundException;
import disscount.shared.PhotoStore;
import disscount.shared.PhotoStoreConfig;
import disscount.shared.Timestamps;
import disscount.storename.StoreNameNormalizer;
import disscount.storename.StoreNameService;
import disscount.user.AccountErased;
import org.springframework.beans.factory.annotation.Qualifier;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
@Transactional(readOnly = true)
public class DigitalCardService {

    static final int MAX_ACTIVE_CARDS = 300;
    static final int MAX_USED_ENTRIES = 50;
    static final int MAX_USED_AGE_DAYS = 400;

    private static final Logger log = LoggerFactory.getLogger(DigitalCardService.class);
    static final String NOT_FOUND = "error.card.notFound";

    private final DigitalCardRepository cardRepository;
    private final DigitalCardPhotoRepository photoRepository;
    private final CardUserLock userLock;
    private final StoreNameService storeNameService;
    private final PhotoCleanupService cleanup;
    @Qualifier(PhotoStoreConfig.CARD_PHOTOS)
    private final PhotoStore photoStore;
    private final DigitalCardMapper mapper;

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

    @PreAuthorize("@digitalCardGuard.ownsCard(#userId, #id)")
    public DigitalCardDto get(UUID userId, UUID id) {
        return toDto(requireActive(userId, id));
    }

    public boolean photosEnabled() {
        return photoStore.enabled();
    }

    /** A replayed create never resurrects, another user's id looks unused; the lock makes the cap atomic. */
    @PreAuthorize("@digitalCardGuard.mayWriteCard(#userId, #id)")
    @Transactional
    public DigitalCardDto upsert(UUID userId, UUID id, DigitalCardRequest request) {
        userLock.acquire(userId);
        DigitalCard card = cardRepository.findById(id).orElse(null);
        boolean created = card == null;
        String previousStore = created ? null : card.getStoreName();
        String previousChain = created ? null : card.getChainCode();

        if (created) {
            if (cardRepository.isDeleted(id)) {
                throw new NotFoundException(NOT_FOUND);
            }
            if (cardRepository.countActiveByUserId(userId) >= MAX_ACTIVE_CARDS) {
                throw new ConflictException("error.card.limitReached");
            }
            card = DigitalCard.builder().id(id).userId(userId).build();
        } else if (!card.getUserId().equals(userId)) {
            throw new NotFoundException(NOT_FOUND);
        }

        apply(card, request);
        // Flushed so @PreUpdate stamps updatedAt once, before the reply is built from it.
        card = cardRepository.saveAndFlush(card);

        // Only a new custom name counts as a use, so edits and replays cannot inflate a suggestion.
        if (card.getChainCode() == null
                && (created || previousChain != null || !sameStore(previousStore, card.getStoreName()))) {
            String storeName = card.getStoreName();
            AfterCommit.run(() -> recordStoreName(userId, storeName));
        }

        return toDto(card);
    }

    @PreAuthorize("@digitalCardGuard.ownsCard(#userId, #id)")
    @Transactional
    public DigitalCardDto setPinned(UUID userId, UUID id, boolean pinned) {
        userLock.acquire(userId);
        if (cardRepository.updatePinnedAt(id, userId, pinned ? Timestamps.nowUtc() : null) == 0) {
            throw new NotFoundException(NOT_FOUND);
        }
        return toDto(requireActive(userId, id));
    }

    @PreAuthorize("@digitalCardGuard.ownsCard(#userId, #id)")
    @Transactional
    public DigitalCardDto setArchived(UUID userId, UUID id, boolean archived) {
        userLock.acquire(userId);
        if (cardRepository.updateArchivedAt(id, userId, archived ? Timestamps.nowUtc() : null) == 0) {
            throw new NotFoundException(NOT_FOUND);
        }
        return toDto(requireActive(userId, id));
    }

    @PreAuthorize("@digitalCardGuard.ownsCard(#userId, #id)")
    @Transactional
    public void delete(UUID userId, UUID id) {
        userLock.acquire(userId);
        DigitalCard card = requireActive(userId, id);

        // Photos are personal data, so they go now rather than with the 30 day purge.
        cleanup.enqueuePrefix(PhotoKeys.cardPrefix(userId, id));
        photoRepository.deleteAllByCardId(id);

        card.setDeletedAt(Timestamps.nowUtc());
        cardRepository.save(card);
    }

    @Transactional
    public void recordUsed(UUID userId, List<CardUsedEntry> entries) {
        if (entries == null || entries.isEmpty() || entries.size() > MAX_USED_ENTRIES) {
            throw new BadRequestException("error.card.usedBatchSize", String.valueOf(MAX_USED_ENTRIES));
        }

        LocalDateTime now = Timestamps.nowUtc();
        LocalDateTime oldest = now.minusDays(MAX_USED_AGE_DAYS);
        for (CardUsedEntry entry : entries) {
            if (entry == null || entry.id() == null || entry.usedAt() == null) {
                throw new BadRequestException("error.card.usedEntryIncomplete");
            }
            // Clamped both ways so a skewed device clock cannot pin a card to the top or bottom of every sort.
            LocalDateTime usedAt = toUtc(entry.usedAt());
            if (usedAt.isAfter(now)) usedAt = now;
            if (usedAt.isBefore(oldest)) usedAt = oldest;
            cardRepository.touchLastUsed(entry.id(), userId, usedAt);
        }
    }

    /** Cards hold card numbers and photos, which must not outlive the account. */
    @EventListener
    @Order(10)
    @Transactional
    public void onAccountErased(AccountErased erased) {
        deleteAllForUser(erased.userId());
    }

    /** Account deletion: nothing of the user's cards may outlive the profile. */
    @Transactional
    public void deleteAllForUser(UUID userId) {
        photoRepository.deleteAllByUserId(userId);
        cardRepository.deleteAllByUserId(userId);
        cleanup.enqueueErasure(PhotoKeys.userPrefix(userId));
    }

    @Transactional
    public int purgeDeletedBefore(LocalDateTime cutoff) {
        List<DigitalCard> stale = cardRepository.findDeletedBefore(cutoff);
        for (DigitalCard card : stale) {
            UUID cardId = card.getId();
            String prefix = PhotoKeys.cardPrefix(card.getUserId(), cardId);
            cleanup.enqueuePrefix(prefix);
            photoRepository.deleteAllByCardId(cardId);
        }
        if (!stale.isEmpty()) {
            cardRepository.purgeByIds(stale.stream().map(DigitalCard::getId).toList());
        }
        return stale.size();
    }

    private void apply(DigitalCard card, DigitalCardRequest r) {
        card.setCardName(r.cardName().trim());
        card.setStoreName(r.storeName().trim());
        card.setCardType(r.cardType());
        card.setChainCode(r.chainCode());
        card.setCodeValue(r.codeValue().trim());
        card.setBarcodeValue(blankToNull(r.barcodeValue()));
        card.setCodeType(r.codeType());
        card.setCardColor(r.cardColor());
        card.setNote(blankToNull(r.note()));
        card.setValidFrom(r.validFrom());
        card.setExpiresOn(r.expiresOn());
        card.setBalance(r.balance() == null ? null : r.balance().setScale(2, RoundingMode.UNNECESSARY));
        // A unit without an amount means nothing, and null unit means points.
        card.setBalanceUnit(r.balance() == null ? null : r.balanceUnit());
    }

    private void recordStoreName(UUID userId, String storeName) {
        try {
            storeNameService.record(userId, storeName);
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
