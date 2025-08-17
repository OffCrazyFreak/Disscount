# DigitalCardsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createCard**](#createcard) | **POST** /api/digital-cards | Create a new digital card|
|[**deleteCard**](#deletecard) | **DELETE** /api/digital-cards/{id} | Delete digital card (soft delete)|
|[**getCardById**](#getcardbyid) | **GET** /api/digital-cards/{id} | Get digital card by ID|
|[**getUserCards**](#getusercards) | **GET** /api/digital-cards/me | Get all digital cards for current user|
|[**updateCard**](#updatecard) | **PUT** /api/digital-cards/{id} | Update digital card|

# **createCard**
> DigitalCardDto createCard(digitalCardRequest)


### Example

```typescript
import {
    DigitalCardsApi,
    Configuration,
    DigitalCardRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new DigitalCardsApi(configuration);

let digitalCardRequest: DigitalCardRequest; //

const { status, data } = await apiInstance.createCard(
    digitalCardRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **digitalCardRequest** | **DigitalCardRequest**|  | |


### Return type

**DigitalCardDto**

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

# **deleteCard**
> { [key: string]: string; } deleteCard()


### Example

```typescript
import {
    DigitalCardsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new DigitalCardsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.deleteCard(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**{ [key: string]: string; }**

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

# **getCardById**
> DigitalCardDto getCardById()


### Example

```typescript
import {
    DigitalCardsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new DigitalCardsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.getCardById(
    id
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **id** | [**string**] |  | defaults to undefined|


### Return type

**DigitalCardDto**

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

# **getUserCards**
> Array<DigitalCardDto> getUserCards()


### Example

```typescript
import {
    DigitalCardsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new DigitalCardsApi(configuration);

const { status, data } = await apiInstance.getUserCards();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<DigitalCardDto>**

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

# **updateCard**
> DigitalCardDto updateCard(digitalCardRequest)


### Example

```typescript
import {
    DigitalCardsApi,
    Configuration,
    DigitalCardRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new DigitalCardsApi(configuration);

let id: string; // (default to undefined)
let digitalCardRequest: DigitalCardRequest; //

const { status, data } = await apiInstance.updateCard(
    id,
    digitalCardRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **digitalCardRequest** | **DigitalCardRequest**|  | |
| **id** | [**string**] |  | defaults to undefined|


### Return type

**DigitalCardDto**

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

