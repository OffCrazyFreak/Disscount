import { DEFAULT_CARD_COLOR } from "@/app/(user)/digital-cards/utils/card-palette";
import type { DigitalCardDto, DigitalCardRequest } from "@/lib/api/types";

export const EMPTY_CARD_VALUES: DigitalCardRequest = {
  cardName: "",
  cardType: "loyalty",
  storeName: "",
  chainCode: null,
  codeValue: "",
  barcodeValue: null,
  codeType: "unknown",
  cardColor: DEFAULT_CARD_COLOR,
  note: null,
  validFrom: null,
  expiresOn: null,
  balance: null,
  balanceUnit: "EUR",
};

export function cardToFormValues(card: DigitalCardDto): DigitalCardRequest {
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
  };
}

// Hidden fields keep their values in the form, so the request must not carry a balance
// the user can no longer see.
export function toCardRequest(values: DigitalCardRequest): DigitalCardRequest {
  const hasBalance = values.cardType === "gift" && values.balance != null;

  return {
    ...values,
    barcodeValue: values.barcodeValue?.trim() || null,
    note: values.note?.trim() || null,
    validFrom: values.validFrom || null,
    expiresOn: values.expiresOn || null,
    balance: hasBalance ? values.balance : null,
    balanceUnit: hasBalance ? (values.balanceUnit ?? null) : null,
  };
}
