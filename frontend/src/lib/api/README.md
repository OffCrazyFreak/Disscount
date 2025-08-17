## @disscount/api-client@1.0

This generator creates TypeScript/JavaScript client that utilizes [axios](https://github.com/axios/axios). The generated Node module can be used in the following environments:

Environment
* Node.js
* Webpack
* Browserify

Language level
* ES5 - you must have a Promises/A+ library installed
* ES6

Module system
* CommonJS
* ES6 module system

It can be used in both TypeScript and JavaScript. In TypeScript, the definition will be automatically resolved via `package.json`. ([Reference](https://www.typescriptlang.org/docs/handbook/declaration-files/consumption.html))

### Building

To build and compile the typescript sources to javascript use:
```
npm install
npm run build
```

### Publishing

First build the package then run `npm publish`

### Consuming

navigate to the folder of your consuming project and run one of the following commands.

_published:_

```
npm install @disscount/api-client@1.0 --save
```

_unPublished (not recommended):_

```
npm install PATH_TO_GENERATED_PACKAGE --save
```

### Documentation for API Endpoints

All URIs are relative to *http://localhost:8080*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*AuthenticationApi* | [**login**](docs/AuthenticationApi.md#login) | **POST** /api/auth/login | Login with email/username and password
*AuthenticationApi* | [**logout**](docs/AuthenticationApi.md#logout) | **POST** /api/auth/logout | Logout from current session
*AuthenticationApi* | [**logoutAll**](docs/AuthenticationApi.md#logoutall) | **POST** /api/auth/logout-all | Logout from all sessions
*AuthenticationApi* | [**refreshToken**](docs/AuthenticationApi.md#refreshtoken) | **POST** /api/auth/refresh | Refresh access token using refresh token
*AuthenticationApi* | [**register**](docs/AuthenticationApi.md#register) | **POST** /api/auth/register | Register a new user
*DigitalCardsApi* | [**createCard**](docs/DigitalCardsApi.md#createcard) | **POST** /api/digital-cards | Create a new digital card
*DigitalCardsApi* | [**deleteCard**](docs/DigitalCardsApi.md#deletecard) | **DELETE** /api/digital-cards/{id} | Delete digital card (soft delete)
*DigitalCardsApi* | [**getCardById**](docs/DigitalCardsApi.md#getcardbyid) | **GET** /api/digital-cards/{id} | Get digital card by ID
*DigitalCardsApi* | [**getUserCards**](docs/DigitalCardsApi.md#getusercards) | **GET** /api/digital-cards/me | Get all digital cards for current user
*DigitalCardsApi* | [**updateCard**](docs/DigitalCardsApi.md#updatecard) | **PUT** /api/digital-cards/{id} | Update digital card
*NotificationsApi* | [**createNotification**](docs/NotificationsApi.md#createnotification) | **POST** /api/notifications | Create a new notification
*NotificationsApi* | [**deleteNotification**](docs/NotificationsApi.md#deletenotification) | **DELETE** /api/notifications/{id} | Delete notification
*NotificationsApi* | [**getCurrentUserNotifications**](docs/NotificationsApi.md#getcurrentusernotifications) | **GET** /api/notifications/me | Get current user\&#39;s notifications with pagination
*NotificationsApi* | [**markAllAsRead**](docs/NotificationsApi.md#markallasread) | **PATCH** /api/notifications/me/read-all | Mark all user\&#39;s notifications as read
*NotificationsApi* | [**markAsRead**](docs/NotificationsApi.md#markasread) | **PATCH** /api/notifications/{id}/read | Mark notification as read
*PinnedPlacesApi* | [**getCurrentUserPinnedPlaces**](docs/PinnedPlacesApi.md#getcurrentuserpinnedplaces) | **GET** /api/pinned-places/me | Get current user\&#39;s pinned places
*PinnedPlacesApi* | [**updatePinnedPlaces**](docs/PinnedPlacesApi.md#updatepinnedplaces) | **POST** /api/pinned-places/bulk | Update user\&#39;s pinned places (bulk operation)
*PinnedStoresApi* | [**getCurrentUserPinnedStores**](docs/PinnedStoresApi.md#getcurrentuserpinnedstores) | **GET** /api/pinned-stores/me | Get current user\&#39;s pinned stores
*PinnedStoresApi* | [**updatePinnedStores**](docs/PinnedStoresApi.md#updatepinnedstores) | **POST** /api/pinned-stores/bulk | Update user\&#39;s pinned stores (bulk operation)
*ShoppingListItemsApi* | [**addItemToShoppingList**](docs/ShoppingListItemsApi.md#additemtoshoppinglist) | **POST** /api/shopping-lists/{listId}/items | Add item to shopping list
*ShoppingListItemsApi* | [**deleteShoppingListItem**](docs/ShoppingListItemsApi.md#deleteshoppinglistitem) | **DELETE** /api/shopping-lists/{listId}/items/{itemId} | Delete shopping list item
*ShoppingListItemsApi* | [**updateShoppingListItem**](docs/ShoppingListItemsApi.md#updateshoppinglistitem) | **PUT** /api/shopping-lists/{listId}/items/{itemId} | Update shopping list item
*ShoppingListsApi* | [**createShoppingList**](docs/ShoppingListsApi.md#createshoppinglist) | **POST** /api/shopping-lists | Create a new shopping list
*ShoppingListsApi* | [**deleteShoppingList**](docs/ShoppingListsApi.md#deleteshoppinglist) | **DELETE** /api/shopping-lists/{id} | Delete shopping list
*ShoppingListsApi* | [**getAllUserShoppingListItems**](docs/ShoppingListsApi.md#getallusershoppinglistitems) | **GET** /api/shopping-lists/items | Get all items from user\&#39;s active shopping lists
*ShoppingListsApi* | [**getCurrentUserShoppingLists**](docs/ShoppingListsApi.md#getcurrentusershoppinglists) | **GET** /api/shopping-lists/me | Get current user\&#39;s shopping lists
*ShoppingListsApi* | [**getShoppingListById**](docs/ShoppingListsApi.md#getshoppinglistbyid) | **GET** /api/shopping-lists/{id} | Get shopping list by ID
*ShoppingListsApi* | [**updateShoppingList**](docs/ShoppingListsApi.md#updateshoppinglist) | **PUT** /api/shopping-lists/{id} | Update shopping list
*UserManagementApi* | [**checkEmailExists**](docs/UserManagementApi.md#checkemailexists) | **GET** /api/users/exists/email/{email} | Check if email exists
*UserManagementApi* | [**checkUsernameExists**](docs/UserManagementApi.md#checkusernameexists) | **GET** /api/users/exists/username/{username} | Check if username exists
*UserManagementApi* | [**deleteCurrentUser**](docs/UserManagementApi.md#deletecurrentuser) | **DELETE** /api/users/me | Soft delete current user
*UserManagementApi* | [**getAllUsers**](docs/UserManagementApi.md#getallusers) | **GET** /api/users | Get all users
*UserManagementApi* | [**getCurrentUser**](docs/UserManagementApi.md#getcurrentuser) | **GET** /api/users/me | Get current authenticated user
*UserManagementApi* | [**updateCurrentUser**](docs/UserManagementApi.md#updatecurrentuser) | **PATCH** /api/users/me | Patch current user\&#39;s profile (username, stayLoggedInDays, notifications)
*WatchlistApi* | [**addToWatchlist**](docs/WatchlistApi.md#addtowatchlist) | **POST** /api/watchlist | Add product to watchlist
*WatchlistApi* | [**getCurrentUserWatchlist**](docs/WatchlistApi.md#getcurrentuserwatchlist) | **GET** /api/watchlist/me | Get current user\&#39;s watchlist
*WatchlistApi* | [**getWatchlistItemByProductApiId**](docs/WatchlistApi.md#getwatchlistitembyproductapiid) | **GET** /api/watchlist/product/{productApiId} | Fetch product from watchlist by product API ID
*WatchlistApi* | [**removeFromWatchlist**](docs/WatchlistApi.md#removefromwatchlist) | **DELETE** /api/watchlist/{id} | Remove product from watchlist


### Documentation For Models

 - [AuthResponse](docs/AuthResponse.md)
 - [BulkPinnedPlaceRequest](docs/BulkPinnedPlaceRequest.md)
 - [BulkPinnedStoreRequest](docs/BulkPinnedStoreRequest.md)
 - [DigitalCardDto](docs/DigitalCardDto.md)
 - [DigitalCardRequest](docs/DigitalCardRequest.md)
 - [LoginRequest](docs/LoginRequest.md)
 - [NotificationDto](docs/NotificationDto.md)
 - [NotificationRequest](docs/NotificationRequest.md)
 - [PageNotificationDto](docs/PageNotificationDto.md)
 - [Pageable](docs/Pageable.md)
 - [PageableObject](docs/PageableObject.md)
 - [PinnedPlaceDto](docs/PinnedPlaceDto.md)
 - [PinnedPlaceRequest](docs/PinnedPlaceRequest.md)
 - [PinnedStoreDto](docs/PinnedStoreDto.md)
 - [PinnedStoreRequest](docs/PinnedStoreRequest.md)
 - [RefreshTokenRequest](docs/RefreshTokenRequest.md)
 - [RegisterRequest](docs/RegisterRequest.md)
 - [ShoppingListDto](docs/ShoppingListDto.md)
 - [ShoppingListItemDto](docs/ShoppingListItemDto.md)
 - [ShoppingListItemRequest](docs/ShoppingListItemRequest.md)
 - [ShoppingListRequest](docs/ShoppingListRequest.md)
 - [SortObject](docs/SortObject.md)
 - [UserDto](docs/UserDto.md)
 - [UserRequest](docs/UserRequest.md)
 - [WatchlistItemDto](docs/WatchlistItemDto.md)
 - [WatchlistItemRequest](docs/WatchlistItemRequest.md)


<a id="documentation-for-authorization"></a>
## Documentation For Authorization


Authentication schemes defined for the API:
<a id="bearerAuth"></a>
### bearerAuth

- **Type**: Bearer authentication (JWT)

