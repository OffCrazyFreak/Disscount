package disscount.digitalCard.service;

import disscount.util.Timestamps;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import disscount.digitalCard.dao.DigitalCardRepository;
import disscount.digitalCard.domain.DigitalCard;
import disscount.digitalCard.dto.DigitalCardDto;
import disscount.digitalCard.dto.DigitalCardRequest;
import disscount.exceptions.BadRequestException;
import disscount.exceptions.UnauthorizedException;
import disscount.storeName.service.StoreNameNormalizer;
import disscount.storeName.service.StoreNameSuggestionService;
import disscount.user.dao.UserRepository;
import disscount.user.domain.User;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class DigitalCardService {

    private final DigitalCardRepository digitalCardRepository;
    private final UserRepository userRepository;
    private final StoreNameSuggestionService storeNameSuggestionService;

    public DigitalCardDto createCard(UUID userId, DigitalCardRequest request) {
        User user = requireUser(userId);

        DigitalCard card = DigitalCard.builder()
                .user(user)
                .cardName(request.getCardName())
                .cardType(request.getCardType())
                .storeName(request.getStoreName())
                .chainCode(request.getChainCode())
                .codeValue(request.getCodeValue())
                .codeType(request.getCodeType())
                .cardColor(request.getCardColor())
                .iconImage(request.getIconImage())
                .frontImage(request.getFrontImage())
                .backImage(request.getBackImage())
                .note(request.getNote())
                .build();

        card = digitalCardRepository.save(card);
        recordStoreNameIfCustom(request.getChainCode(), request.getStoreName());

        return convertToDto(card);
    }

    @Transactional(readOnly = true)
    public List<DigitalCardDto> getUserCards(UUID userId) {
        User user = requireUser(userId);

        return digitalCardRepository.findActiveByUser(user)
                .stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    public DigitalCardDto updateCard(UUID cardId, UUID userId, DigitalCardRequest request) {
        User user = requireUser(userId);
        DigitalCard card = requireCard(cardId, user);

        String previousStoreName = card.getStoreName();

        card.setCardName(request.getCardName());
        card.setCardType(request.getCardType());
        card.setStoreName(request.getStoreName());
        card.setChainCode(request.getChainCode());
        card.setCodeValue(request.getCodeValue());
        card.setCodeType(request.getCodeType());
        card.setCardColor(request.getCardColor());
        card.setIconImage(request.getIconImage());
        card.setFrontImage(request.getFrontImage());
        card.setBackImage(request.getBackImage());
        card.setNote(request.getNote());

        card = digitalCardRepository.save(card);

        // Only a genuinely new name counts, so re-saving a card does not inflate its
        // suggestion's usage count.
        boolean nameChanged = !StoreNameNormalizer.normalize(previousStoreName)
                .equals(StoreNameNormalizer.normalize(request.getStoreName()));
        if (nameChanged) {
            recordStoreNameIfCustom(request.getChainCode(), request.getStoreName());
        }

        return convertToDto(card);
    }

    public void deleteCard(UUID cardId, UUID userId) {
        User user = requireUser(userId);
        DigitalCard card = requireCard(cardId, user);

        card.setDeletedAt(Timestamps.nowUtc());
        digitalCardRepository.save(card);
    }

    public DigitalCardDto setPinned(UUID cardId, UUID userId, boolean pinned) {
        User user = requireUser(userId);
        DigitalCard card = requireCard(cardId, user);

        card.setPinnedAt(pinned ? Timestamps.nowUtc() : null);
        card = digitalCardRepository.save(card);

        return convertToDto(card);
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    /** Ownership is enforced by the query itself, so there is no separate check to forget. */
    private DigitalCard requireCard(UUID cardId, User user) {
        return digitalCardRepository.findActiveByIdAndUser(cardId, user)
                .orElseThrow(() -> new BadRequestException("Digital card not found"));
    }

    // Official chains already have their own autocomplete group, so only free text is
    // worth offering back to other users.
    private void recordStoreNameIfCustom(String chainCode, String storeName) {
        if (chainCode == null || chainCode.isBlank()) {
            storeNameSuggestionService.record(storeName);
        }
    }

    private DigitalCardDto convertToDto(DigitalCard card) {
        return DigitalCardDto.builder()
                .id(card.getId())
                .userId(card.getUser().getId())
                .cardName(card.getCardName())
                .cardType(card.getCardType())
                .storeName(card.getStoreName())
                .chainCode(card.getChainCode())
                .codeValue(card.getCodeValue())
                .codeType(card.getCodeType())
                .cardColor(card.getCardColor())
                .iconImage(card.getIconImage())
                .frontImage(card.getFrontImage())
                .backImage(card.getBackImage())
                .note(card.getNote())
                .pinnedAt(card.getPinnedAt())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .build();
    }
}
