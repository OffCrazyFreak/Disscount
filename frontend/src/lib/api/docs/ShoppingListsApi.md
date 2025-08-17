# ShoppingListsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createShoppingList**](#createshoppinglist) | **POST** /api/shopping-lists | Create a new shopping list|
|[**deleteShoppingList**](#deleteshoppinglist) | **DELETE** /api/shopping-lists/{id} | Delete shopping list|
|[**getAllUserShoppingListItems**](#getallusershoppinglistitems) | **GET** /api/shopping-lists/items | Get all items from user\&#39;s active shopping lists|
|[**getCurrentUserShoppingLists**](#getcurrentusershoppinglists) | **GET** /api/shopping-lists/me | Get current user\&#39;s shopping lists|
|[**getShoppingListById**](#getshoppinglistbyid) | **GET** /api/shopping-lists/{id} | Get shopping list by ID|
|[**updateShoppingList**](#updateshoppinglist) | **PUT** /api/shopping-lists/{id} | Update shopping list|

# **createShoppingList**
> ShoppingListDto createShoppingList(shoppingListRequest)


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration,
    ShoppingListRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

let shoppingListRequest: ShoppingListRequest; //

const { status, data } = await apiInstance.createShoppingList(
    shoppingListRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shoppingListRequest** | **ShoppingListRequest**|  | |


### Return type

**ShoppingListDto**

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

# **deleteShoppingList**
> deleteShoppingList()


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.deleteShoppingList(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


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

# **getAllUserShoppingListItems**
> Array<ShoppingListItemDto> getAllUserShoppingListItems()


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

const { status, data } = await apiInstance.getAllUserShoppingListItems();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<ShoppingListItemDto>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getCurrentUserShoppingLists**
> Array<ShoppingListDto> getCurrentUserShoppingLists()


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

const { status, data } = await apiInstance.getCurrentUserShoppingLists();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<ShoppingListDto>**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **getShoppingListById**
> ShoppingListDto getShoppingListById()


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.getShoppingListById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**ShoppingListDto**

### Authorization

[bearerAuth](../README.md#bearerAuth)

### HTTP request headers

 - **Content-Type**: Not defined
 - **Accept**: */*


### HTTP response details
| Status code | Description | Response headers |
|-------------|-------------|------------------|
|**200** | OK |  -  |

[[Back to top]](#) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to Model list]](../README.md#documentation-for-models) [[Back to README]](../README.md)

# **updateShoppingList**
> ShoppingListDto updateShoppingList(shoppingListRequest)


### Example

```typescript
import {
    ShoppingListsApi,
    Configuration,
    ShoppingListRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new ShoppingListsApi(configuration);

let id: string; // (default to undefined)
let shoppingListRequest: ShoppingListRequest; //

const { status, data } = await apiInstance.updateShoppingList(
    id,
    shoppingListRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **shoppingListRequest** | **ShoppingListRequest**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**ShoppingListDto**

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

