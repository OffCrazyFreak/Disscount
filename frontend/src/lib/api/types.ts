// General response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

// Auth types
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

export interface RegisterRequest {
  username?: string;
  email: string;
  password: string;
  stayLoggedInDays?: number;
  notificationsPush?: boolean;
  notificationsEmail?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  user: UserDto;
}

// User types
export interface UserRequest {
  username?: string;
  stayLoggedInDays?: number;
  notificationsPush?: boolean;
  notificationsEmail?: boolean;
}

export interface UserDto extends UserRequest {
  id: string;
  username: string;
  email: string;
  lastLoginAt: string;
  stayLoggedInDays: number;
  notificationsPush: boolean;
  notificationsEmail: boolean;
  subscriptionTier: "FREE" | "PRO";
  subscriptionStartDate?: string;
  numberOfAiPrompts: number;
  lastAiPromptAt?: string;
  createdAt: string;
  // User preferences
  pinnedStores?: PinnedStoreDto[];
  pinnedPlaces?: PinnedPlaceDto[];
}

// Base types for preferences
// Preferences - Request as base
export interface PinnedStoreRequest {
  storeApiId: string;
  storeName: string;
}

export interface PinnedStoreDto extends PinnedStoreRequest {
  id: string;
  userId: string;
}

export interface BulkPinnedStoreRequest {
  stores: PinnedStoreRequest[];
}

export interface PinnedPlaceRequest {
  placeApiId: string;
  placeName: string;
}

export interface PinnedPlaceDto extends PinnedPlaceRequest {
  id: string;
  userId: string;
}

export interface BulkPinnedPlaceRequest {
  places: PinnedPlaceRequest[];
}

// Base types for shopping lists
// Shopping lists
export interface ShoppingListRequest {
  title: string;
  isPublic?: boolean;
  aiPrompt?: string;
}

export interface ShoppingListItemRequest {
  productApiId: string;
  productName: string;
  amount?: number;
  isChecked?: boolean;
}

export interface ShoppingListItemDto extends Required<ShoppingListItemRequest> {
  id: string;
  shoppingListId: string;
  createdAt: string;
}

export interface ShoppingListDto extends ShoppingListRequest {
  id: string;
  ownerId: string;
  aiAnswer?: string;
  updatedAt: string;
  createdAt: string;
  items: ShoppingListItemDto[];
}

// Base type for digital cards
// Digital cards
export interface DigitalCardRequest {
  title: string;
  value: string;
  type: string;
  codeType: string;
  color?: string;
  note?: string;
}

export interface DigitalCardDto extends DigitalCardRequest {
  id: string;
  createdAt: string;
}

// Base type for watchlist items
// Watchlist
export interface WatchlistItemRequest {
  productApiId: string;
  productName: string;
}

export interface WatchlistItemDto extends WatchlistItemRequest {
  id: string;
  userId: string;
  lastNotifiedAt?: string;
  createdAt: string;
}

// Base type for notifications
// Notifications
export interface NotificationRequest {
  message: string;
  relatedProductApiId?: string;
  relatedStoreApiId?: string;
}

export interface NotificationDto extends NotificationRequest {
  id: string;
  userId: string;
  isRead: boolean;
  createdAt: string;
}

// Utility types for common patterns
export type CreateRequest<T> = Omit<
  T,
  "id" | "createdAt" | "updatedAt" | "userId" | "ownerId"
>;
export type UpdateRequest<T> = Partial<CreateRequest<T>>;
export type EntityWithId = { id: string };
export type EntityWithTimestamps = { createdAt: string; updatedAt?: string };
export type EntityWithUser = { userId: string };
export type EntityWithOwner = { ownerId: string };

// Type inference examples - these show how Request types relate to Dto types
export type InferredDigitalCardRequest = CreateRequest<DigitalCardDto>;
export type InferredShoppingListRequest = CreateRequest<ShoppingListDto>;
export type InferredWatchlistItemRequest = CreateRequest<WatchlistItemDto>;
export type InferredNotificationRequest = CreateRequest<NotificationDto>;

// Pagination types (commonly used in APIs)
export interface Pageable {
  page: number;
  size: number;
  sort?: string[];
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
