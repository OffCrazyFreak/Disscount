# WatchlistApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**addToWatchlist**](#addtowatchlist) | **POST** /api/watchlist | Add product to watchlist|
|[**getCurrentUserWatchlist**](#getcurrentuserwatchlist) | **GET** /api/watchlist/me | Get current user\&#39;s watchlist|
|[**getWatchlistItemByProductApiId**](#getwatchlistitembyproductapiid) | **GET** /api/watchlist/product/{productApiId} | Fetch product from watchlist by product API ID|
|[**removeFromWatchlist**](#removefromwatchlist) | **DELETE** /api/watchlist/{id} | Remove product from watchlist|

# **addToWatchlist**
> WatchlistItemDto addToWatchlist(watchlistItemRequest)


### Example

```typescript
import {
    WatchlistApi,
    Configuration,
    WatchlistItemRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new WatchlistApi(configuration);

let watchlistItemRequest: WatchlistItemRequest; //

const { status, data } = await apiInstance.addToWatchlist(
    watchlistItemRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **watchlistItemRequest** | **WatchlistItemRequest**|  | |


### Return type

**WatchlistItemDto**

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

# **getCurrentUserWatchlist**
> Array<WatchlistItemDto> getCurrentUserWatchlist()


### Example

```typescript
import {
    WatchlistApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new WatchlistApi(configuration);

const { status, data } = await apiInstance.getCurrentUserWatchlist();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<WatchlistItemDto>**

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

# **getWatchlistItemByProductApiId**
> WatchlistItemDto getWatchlistItemByProductApiId()


### Example

```typescript
import {
    WatchlistApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new WatchlistApi(configuration);

let productApiId: string; // (default to undefined)

const { status, data } = await apiInstance.getWatchlistItemByProductApiId(
    productApiId
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **productApiId** | [**string**] |  | defaults to undefined|


### Return type

**WatchlistItemDto**

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

# **removeFromWatchlist**
> removeFromWatchlist()


### Example

```typescript
import {
    WatchlistApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new WatchlistApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.removeFromWatchlist(
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

