# NotificationsApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**createNotification**](#createnotification) | **POST** /api/notifications | Create a new notification|
|[**deleteNotification**](#deletenotification) | **DELETE** /api/notifications/{id} | Delete notification|
|[**getCurrentUserNotifications**](#getcurrentusernotifications) | **GET** /api/notifications/me | Get current user\&#39;s notifications with pagination|
|[**markAllAsRead**](#markallasread) | **PATCH** /api/notifications/me/read-all | Mark all user\&#39;s notifications as read|
|[**markAsRead**](#markasread) | **PATCH** /api/notifications/{id}/read | Mark notification as read|

# **createNotification**
> NotificationDto createNotification(notificationRequest)


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    NotificationRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let notificationRequest: NotificationRequest; //

const { status, data } = await apiInstance.createNotification(
    notificationRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **notificationRequest** | **NotificationRequest**|  | |


### Return type

**NotificationDto**

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

# **deleteNotification**
> deleteNotification()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.deleteNotification(
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

# **getCurrentUserNotifications**
> PageNotificationDto getCurrentUserNotifications()


### Example

```typescript
import {
    NotificationsApi,
    Configuration,
    Pageable
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let pageable: Pageable; // (default to undefined)

const { status, data } = await apiInstance.getCurrentUserNotifications(
    pageable
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **pageable** | **Pageable** |  | defaults to undefined|


### Return type

**PageNotificationDto**

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

# **markAllAsRead**
> markAllAsRead()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

const { status, data } = await apiInstance.markAllAsRead();
```

### Parameters
This endpoint does not have any parameters.


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

# **markAsRead**
> markAsRead()


### Example

```typescript
import {
    NotificationsApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new NotificationsApi(configuration);

let id: string; // (default to undefined)

const { status, data } = await apiInstance.markAsRead(
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

