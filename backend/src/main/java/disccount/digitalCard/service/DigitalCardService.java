package disccount.digitalCard.service;

import disccount.digitalCard.dao.DigitalCardRepository;
import disccount.digitalCard.domain.DigitalCard;
import disccount.digitalCard.dto.DigitalCardDto;
import disccount.digitalCard.dto.DigitalCardRequest;
import disccount.exceptions.BadRequestException;
import disccount.exceptions.UnauthorizedException;
import disccount.user.dao.UserRepository;
import disccount.user.domain.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class DigitalCardService {

    private final DigitalCardRepository digitalCardRepository;
    private final UserRepository userRepository;

    public DigitalCardDto createCard(UUID userId, DigitalCardRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        DigitalCard card = DigitalCard.builder()
                .user(user)
                .title(request.getTitle())
                .value(request.getValue())
                .type(request.getType())
                .codeType(request.getCodeType())
                .color(request.getColor())
                .note(request.getNote())
                .build();

        card = digitalCardRepository.save(card);
        return convertToDto(card);
    }

    public List<DigitalCardDto> getUserCards(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return digitalCardRepository.findActiveByUser(user)
                .stream()
                .map(this::convertToDto)
                .toList();
    }

    public Optional<DigitalCardDto> getCardById(UUID cardId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        return digitalCardRepository.findActiveByIdAndUser(cardId, user)
                .map(this::convertToDto);
    }

    public DigitalCardDto updateCard(UUID cardId, UUID userId, DigitalCardRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        DigitalCard card = digitalCardRepository.findActiveByIdAndUser(cardId, user)
                .orElseThrow(() -> new BadRequestException("Card not found"));

        // Replace full resource (PUT semantics)
        card.setTitle(request.getTitle());
        card.setValue(request.getValue());
        card.setType(request.getType());
        card.setCodeType(request.getCodeType());
        card.setColor(request.getColor());
        card.setNote(request.getNote());

        card = digitalCardRepository.save(card);
        return convertToDto(card);
    }

    public void deleteCard(UUID cardId, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        DigitalCard card = digitalCardRepository.findActiveByIdAndUser(cardId, user)
                .orElseThrow(() -> new BadRequestException("Card not found"));

        card.setDeletedAt(LocalDateTime.now());
        digitalCardRepository.save(card);
    }

    private DigitalCardDto convertToDto(DigitalCard card) {
        return DigitalCardDto.builder()
                .id(card.getId())
                .title(card.getTitle())
                .value(card.getValue())
                .type(card.getType())
                .codeType(card.getCodeType())
                .color(card.getColor())
                .note(card.getNote())
                .createdAt(card.getCreatedAt())
                .build();
    }
}
