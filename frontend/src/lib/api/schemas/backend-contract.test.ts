import { describe, expect, it } from "vitest";
import type { z } from "zod";

import {
  acquisitionChannelSchema,
  adminPhotoQueueItemSchema,
  adminPhotoQueuePageSchema,
  adminProductImageSchema,
  adminProductPhotosSchema,
  bulkFavoriteStoreRequestSchema,
  contributorPhotoCountSchema,
  bulkPinnedPlaceRequestSchema,
  bulkPinnedStoreRequestSchema,
  cardPhotoDtoSchema,
  contactMessageDtoSchema,
  contactMessageRequestSchema,
  digitalCardDtoSchema,
  digitalCardRequestSchema,
  digitalCardsConfigSchema,
  favoriteStoreDtoSchema,
  listedEansResponseSchema,
  photoQueueFilterSchema,
  pinnedPlaceDtoSchema,
  pinnedStoreDtoSchema,
  productImageCropSchema,
  productImageSchema,
  productImageSourceSchema,
  productImagesResponseSchema,
  productImageStatusSchema,
  productThumbnailsResponseSchema,
  shoppingListCopyRequestSchema,
  shoppingListDtoSchema,
  shoppingListItemDtoSchema,
  shoppingListItemRequestSchema,
  shoppingListRequestSchema,
  storeNameSuggestionDtoSchema,
  userDtoSchema,
  userRequestSchema,
  watchlistItemDtoSchema,
  watchlistItemRequestSchema,
} from "@/lib/api/schemas";
import {
  describeZodSchema,
  findDrift,
  readApiContract,
} from "@/test/api-contract";

const contract = readApiContract();

const MIRRORED_DTOS: Record<string, z.ZodType> = {
  AdminImageDto: adminProductImageSchema,
  AdminProductDto: adminProductPhotosSchema,
  AdminQueueItemDto: adminPhotoQueueItemSchema,
  AdminQueuePageDto: adminPhotoQueuePageSchema,
  BulkFavoriteStoreRequest: bulkFavoriteStoreRequestSchema,
  ContributorPhotoCountDto: contributorPhotoCountSchema,
  BulkPinnedPlaceRequest: bulkPinnedPlaceRequestSchema,
  BulkPinnedStoreRequest: bulkPinnedStoreRequestSchema,
  CardPhotoDto: cardPhotoDtoSchema,
  ContactMessageDto: contactMessageDtoSchema,
  ContactMessageRequest: contactMessageRequestSchema,
  CropDto: productImageCropSchema,
  DigitalCardDto: digitalCardDtoSchema,
  DigitalCardRequest: digitalCardRequestSchema,
  DigitalCardsConfigDto: digitalCardsConfigSchema,
  FavoriteStoreDto: favoriteStoreDtoSchema,
  ListedEansDto: listedEansResponseSchema,
  PinnedPlaceDto: pinnedPlaceDtoSchema,
  PinnedStoreDto: pinnedStoreDtoSchema,
  ProductImageDto: productImageSchema,
  ProductImagesDto: productImagesResponseSchema,
  ProductThumbnailsDto: productThumbnailsResponseSchema,
  ShoppingListCopyRequest: shoppingListCopyRequestSchema,
  ShoppingListDto: shoppingListDtoSchema,
  ShoppingListItemDto: shoppingListItemDtoSchema,
  ShoppingListItemRequest: shoppingListItemRequestSchema,
  ShoppingListRequest: shoppingListRequestSchema,
  StoreNameSuggestionDto: storeNameSuggestionDtoSchema,
  UserDto: userDtoSchema,
  UserRequest: userRequestSchema,
  WatchlistItemDto: watchlistItemDtoSchema,
  WatchlistItemRequest: watchlistItemRequestSchema,
};

// Sent as an inline object by the query functions, or nested in a Bulk request above.
const DTOS_WITHOUT_A_ZOD_SCHEMA = [
  "CardArchiveRequest",
  "CardPinRequest",
  "CardUsedEntry",
  "CropRequest",
  "FavoriteStoreRequest",
  "ImageStatusRequest",
  "PinnedPlaceRequest",
  "PinnedStoreRequest",
  "SetMainRequest",
  "UpdateAccountTypeRequest",
];

const NO_BACKEND_VALUES = "zod enum, backend states no values";

// Each entry is a deliberate difference. One that stops differing fails the test, so none outlives its reason.
const ACCEPTED_DRIFT: Record<string, string> = {
  // Filled on the client from the session and the preferences endpoints.
  "UserDto.name": "only in the zod schema",
  "UserDto.pinnedStores": "only in the zod schema",
  "UserDto.pinnedPlaces": "only in the zod schema",
  // Typed ListAccess in Java, but resolvedLinkAccess() never answers OWNER.
  "ShoppingListDto.linkAccess":
    "backend [NONE,VIEW,SHOP,EDIT,OWNER], zod [NONE,VIEW,SHOP,EDIT]",
  // Rules, not shapes: the backend validates both with its own pattern or format.
  "UserRequest.onboardingOutcome": "zod union, not compared",
  "ContactMessageRequest.email": "zod union, not compared",
  // Plain strings in Java. MIRRORED_ENUMS and the request's regex hold the values to the backend.
  "CardPhotoDto.slot": NO_BACKEND_VALUES,
  "DigitalCardDto.cardType": NO_BACKEND_VALUES,
  "DigitalCardDto.codeType": NO_BACKEND_VALUES,
  "DigitalCardDto.photos[].slot": NO_BACKEND_VALUES,
  "ProductImageDto.source": NO_BACKEND_VALUES,
  "ProductImageDto.status": NO_BACKEND_VALUES,
  "ProductImagesDto.images[].source": NO_BACKEND_VALUES,
  "ProductImagesDto.images[].status": NO_BACKEND_VALUES,
  "AdminImageDto.source": NO_BACKEND_VALUES,
  "AdminImageDto.status": NO_BACKEND_VALUES,
  "AdminProductDto.images[].source": NO_BACKEND_VALUES,
  "AdminProductDto.images[].status": NO_BACKEND_VALUES,
};

const { shape: userDtoShape } = userDtoSchema;
const { shape: listShape } = shoppingListDtoSchema;

// The backend's values as the frontend sends them: the queue filter travels lowercase and parseFilter uppercases it.
const MIRRORED_ENUMS: Record<string, string[]> = {
  AccountType: enumValues(userDtoShape.accountType),
  AcquisitionChannel: enumValues(acquisitionChannelSchema),
  CardPhotoSlot: enumValues(cardPhotoDtoSchema.shape.slot),
  ImageSource: enumValues(productImageSourceSchema),
  ImageStatus: enumValues(productImageStatusSchema),
  LinkAccess: enumValues(shoppingListRequestSchema.shape.linkAccess),
  ListAccess: enumValues(listShape.myAccess),
  QueueFilter: enumValues(photoQueueFilterSchema).map((filter) =>
    filter.toUpperCase(),
  ),
  WatchType: enumValues(watchlistItemDtoSchema.shape.watchType),
};

// Why a photo was hidden is bookkeeping no response carries, and a file's visibility only sets its disk permissions.
const BACKEND_ONLY_ENUMS = ["HiddenReason", "Visibility"];

function enumValues(schema: z.ZodType): string[] {
  const described = describeZodSchema(schema);
  const values = described.enum ?? described.anyOf?.[0].enum;
  return (values ?? []) as string[];
}

describe("backend contract", () => {
  it("files every backend DTO as mirrored by zod or as having no schema", () => {
    expect(Object.keys(contract.schemas).sort()).toEqual(
      [...Object.keys(MIRRORED_DTOS), ...DTOS_WITHOUT_A_ZOD_SCHEMA].sort(),
    );
  });

  it("keeps every mirrored DTO's fields, types, nullability and enums equal to the backend's", () => {
    const drift = Object.assign(
      {},
      ...Object.entries(MIRRORED_DTOS).map(([name, schema]) =>
        findDrift(
          contract,
          name,
          contract.schemas[name],
          describeZodSchema(schema),
          name.endsWith("Request") ? "request" : "response",
        ),
      ),
    );

    expect(drift).toEqual(ACCEPTED_DRIFT);
  });

  it("files every backend enum as mirrored by zod or as backend only", () => {
    expect(Object.keys(contract.enums).sort()).toEqual(
      [...Object.keys(MIRRORED_ENUMS), ...BACKEND_ONLY_ENUMS].sort(),
    );
  });

  it.each(Object.entries(MIRRORED_ENUMS))(
    "keeps %s equal to the backend's values",
    (name, values) => {
      expect([...values].sort()).toEqual(contract.enums[name]);
    },
  );
});
