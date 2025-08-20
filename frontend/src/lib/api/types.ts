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
export interface UserDto {
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

export interface UserRequest {
  username?: string;
  stayLoggedInDays?: number;
  notificationsPush?: boolean;
  notificationsEmail?: boolean;
}

// Preferences types
export interface PinnedStoreRequest {
  storeApiId: string;
  storeName: string;
}

export interface PinnedStoreDto {
  id: string;
  userId: string;
  storeApiId: string;
  storeName: string;
}

export interface BulkPinnedStoreRequest {
  stores: PinnedStoreRequest[];
}

export interface PinnedPlaceRequest {
  placeApiId: string;
  placeName: string;
}

export interface PinnedPlaceDto {
  id: string;
  userId: string;
  placeApiId: string;
  placeName: string;
}

export interface BulkPinnedPlaceRequest {
  places: PinnedPlaceRequest[];
}
