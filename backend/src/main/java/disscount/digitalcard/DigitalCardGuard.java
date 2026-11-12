package disscount.digitalcard;

import disscount.shared.errors.NotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Card ownership, named in the card services' @PreAuthorize. A foreign card throws the card's 404 instead of
 * returning false, because a false is a 403, which would confirm the id belongs to someone.
 */
@Component("digitalCardGuard")
@RequiredArgsConstructor
class DigitalCardGuard {

    private final DigitalCardRepository cards;

    public boolean ownsCard(UUID userId, UUID cardId) {
        if (!cards.existsByIdAndUserId(cardId, userId)) {
            throw new NotFoundException(DigitalCardService.NOT_FOUND);
        }

        return true;
    }

    /** A PUT may create the id, so only someone else's live card is refused; the service keeps the tombstone rule. */
    public boolean mayWriteCard(UUID userId, UUID cardId) {
        if (cards.existsByIdAndUserIdNot(cardId, userId)) {
            throw new NotFoundException(DigitalCardService.NOT_FOUND);
        }

        return true;
    }
}
