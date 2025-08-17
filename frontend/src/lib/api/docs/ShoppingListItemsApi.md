# ShoppingListItemsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addItemToShoppingList**](#additemtoshoppinglist) | **POST** /api/shopping-lists/{listId}/items | Add item to shopping list|
|[**deleteShoppingListItem**](#deleteshoppinglistitem) | **DELETE** /api/shopping-lists/{listId}/items/{itemId} | Delete shopping list item|
|[**updateShoppingListItem**](#updateshoppinglistitem) | **PUT** /api/shopping-lists/{listId}/items/{itemId} | Update shopping list item|

# **addItemToShoppingList**
> ShoppingListItemDto addItemToShoppingList(shoppingListItemRequest)


### Example

```typescript
import {
    ShoppingListItemsApi,
    Configuration,
    ShoppingListItemRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListItemsApi(configuration);

let listId: string; // (default to undefined)
let shoppingListItemRequest: ShoppingListItemRequest; //

const { status, data } = await apiInstance.addItemToShoppingList(
    listId,
    shoppingListItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shoppingListItemRequest** | **ShoppingListItemRequest**|  | |
| **listId** | [**string**] |  | defaults to undefined|


### Return type

**ShoppingListItemDto**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **deleteShoppingListItem**
> deleteShoppingListItem()


### Example

```typescript
import {
    ShoppingListItemsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListItemsApi(configuration);

let listId: string; // (default to undefined)
let itemId: string; // (default to undefined)

const { status, data } = await apiInstance.deleteShoppingListItem(
    listId,
    itemId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **listId** | [**string**] |  | defaults to undefined|
| **itemId** | [**string**] |  | defaults to undefined|


### Return type

void (empty response body)

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: Not defined


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateShoppingListItem**
> ShoppingListItemDto updateShoppingListItem(shoppingListItemRequest)


### Example

```typescript
import {
    ShoppingListItemsApi,
    Configuration,
    ShoppingListItemRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListItemsApi(configuration);

let listId: string; // (default to undefined)
let itemId: string; // (default to undefined)
let shoppingListItemRequest: ShoppingListItemRequest; //

const { status, data } = await apiInstance.updateShoppingListItem(
    listId,
    itemId,
    shoppingListItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shoppingListItemRequest** | **ShoppingListItemRequest**|  | |
| **listId** | [**string**] |  | defaults to undefined|
| **itemId** | [**string**] |  | defaults to undefined|


### Return type

**ShoppingListItemDto**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: application/json
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

