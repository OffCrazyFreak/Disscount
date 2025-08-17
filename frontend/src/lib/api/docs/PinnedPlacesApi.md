# PinnedPlacesApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**getCurrentUserPinnedPlaces**](#getcurrentuserpinnedplaces) | **GET** /api/pinned-places/me | Get current user\&#39;s pinned places|
|[**updatePinnedPlaces**](#updatepinnedplaces) | **POST** /api/pinned-places/bulk | Update user\&#39;s pinned places (bulk operation)|

# **getCurrentUserPinnedPlaces**
> Array<PinnedPlaceDto> getCurrentUserPinnedPlaces()


### Example

```typescript
import {
    PinnedPlacesApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new PinnedPlacesApi(configuration);

const { status, data } = await apiInstance.getCurrentUserPinnedPlaces();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<PinnedPlaceDto>**

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

# **updatePinnedPlaces**
> Array<PinnedPlaceDto> updatePinnedPlaces(bulkPinnedPlaceRequest)


### Example

```typescript
import {
    PinnedPlacesApi,
    Configuration,
    BulkPinnedPlaceRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new PinnedPlacesApi(configuration);

let bulkPinnedPlaceRequest: BulkPinnedPlaceRequest; //

const { status, data } = await apiInstance.updatePinnedPlaces(
    bulkPinnedPlaceRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **bulkPinnedPlaceRequest** | **BulkPinnedPlaceRequest**|  | |


### Return type

**Array<PinnedPlaceDto>**

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

