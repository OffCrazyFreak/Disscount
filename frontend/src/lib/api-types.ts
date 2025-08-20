// Common API types and interfaces

// Product types
export interface Product {
  id: string;
  name: string;
  price: number;
  store: string;
  location: string;
  image?: string;
  discount?: number;
  originalPrice?: number;
  barcode?: string;
  category?: string;
}

export interface ProductSearchResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

// User types
export interface UserDto {
  id: string;
  username?: string;
  email: string;
  lastLoginAt?: string;
  stayLoggedInDays?: number;
  notificationsPush?: boolean;
  notificationsEmail?: boolean;
  subscriptionTier?: "FREE" | "PRO";
  subscriptionStartDate?: string;
  numberOfAiPrompts?: number;
  lastAiPromptAt?: string;
  createdAt?: string;
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

export interface BulkPinnedStoreRequest {
  stores: PinnedStoreRequest[];
}

export interface PinnedPlaceRequest {
  placeApiId: string;
  placeName: string;
}

export interface BulkPinnedPlaceRequest {
  places: PinnedPlaceRequest[];
}

export interface PinnedStoreDto {
  id: string;
  userId: string;
  storeApiId: string;
  storeName: string;
}

export interface PinnedPlaceDto {
  id: string;
  userId: string;
  placeApiId: string;
  placeName: string;
}
