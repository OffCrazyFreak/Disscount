import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";

/** The upsert is a full PUT, so a single-field change still has to send every field back. */
export function cardRequestFromDto(
  card: DigitalCardDto,
  changes: Partial<DigitalCardRequest> = {},
): DigitalCardRequest {
  return {
    cardName: card.cardName,
    cardType: card.cardType,
    storeName: card.storeName,
    chainCode: card.chainCode,
    codeValue: card.codeValue,
    barcodeValue: card.barcodeValue,
    codeType: card.codeType,
    cardColor: card.cardColor,
    note: card.note,
    validFrom: card.validFrom,
    expiresOn: card.expiresOn,
    balance: card.balance,
    balanceUnit: card.balanceUnit,
    ...changes,
  };
}
