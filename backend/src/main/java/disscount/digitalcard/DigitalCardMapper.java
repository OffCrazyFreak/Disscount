package disscount.digitalcard;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DigitalCardMapper {

    public DigitalCardDto toDto(DigitalCard card, List<DigitalCardPhoto> photos) {
        return DigitalCardDto.builder()
                .id(card.getId())
                .cardName(card.getCardName())
                .cardType(card.getCardType())
                .storeName(card.getStoreName())
                .chainCode(card.getChainCode())
                .codeValue(card.getCodeValue())
                .barcodeValue(card.getBarcodeValue())
                .codeType(card.getCodeType())
                .cardColor(card.getCardColor())
                .note(card.getNote())
                .validFrom(card.getValidFrom())
                .expiresOn(card.getExpiresOn())
                .balance(card.getBalance())
                .balanceUnit(card.getBalanceUnit())
                .pinnedAt(card.getPinnedAt())
                .lastUsedAt(card.getLastUsedAt())
                .archivedAt(card.getArchivedAt())
                .createdAt(card.getCreatedAt())
                .updatedAt(card.getUpdatedAt())
                .photos(photos.stream().map(CardPhotoDto::from).toList())
                .build();
    }
}
