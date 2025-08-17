# PinnedStoresApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCurrentUserPinnedStores**](#getcurrentuserpinnedstores) | **GET** /api/pinned-stores/me | Get current user\&#39;s pinned stores|
|[**updatePinnedStores**](#updatepinnedstores) | **POST** /api/pinned-stores/bulk | Update user\&#39;s pinned stores (bulk operation)|

# **getCurrentUserPinnedStores**
> Array<PinnedStoreDto> getCurrentUserPinnedStores()


### Example

```typescript
import {
    PinnedStoresApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new PinnedStoresApi(configuration);

const { status, data } = await apiInstance.getCurrentUserPinnedStores();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<PinnedStoreDto>**

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

# **updatePinnedStores**
> Array<PinnedStoreDto> updatePinnedStores(bulkPinnedStoreRequest)


### Example

```typescript
import {
    PinnedStoresApi,
    Configuration,
    BulkPinnedStoreRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new PinnedStoresApi(configuration);

let bulkPinnedStoreRequest: BulkPinnedStoreRequest; //

const { status, data } = await apiInstance.updatePinnedStores(
    bulkPinnedStoreRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **bulkPinnedStoreRequest** | **BulkPinnedStoreRequest**|  | |


### Return type

**Array<PinnedStoreDto>**

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

