# UserManagementApi

All URIs are relative to *http://localhost:8080*

|Method | HTTP request | Description|
|------------- | ------------- | -------------|
|[**checkEmailExists**](#checkemailexists) | **GET** /api/users/exists/email/{email} | Check if email exists|
|[**checkUsernameExists**](#checkusernameexists) | **GET** /api/users/exists/username/{username} | Check if username exists|
|[**deleteCurrentUser**](#deletecurrentuser) | **DELETE** /api/users/me | Soft delete current user|
|[**getAllUsers**](#getallusers) | **GET** /api/users | Get all users|
|[**getCurrentUser**](#getcurrentuser) | **GET** /api/users/me | Get current authenticated user|
|[**updateCurrentUser**](#updatecurrentuser) | **PATCH** /api/users/me | Patch current user\&#39;s profile (username, stayLoggedInDays, notifications)|

# **checkEmailExists**
> { [key: string]: boolean; } checkEmailExists()


### Example

```typescript
import {
    UserManagementApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

let email: string; // (default to undefined)

const { status, data } = await apiInstance.checkEmailExists(
    email
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **email** | [**string**] |  | defaults to undefined|


### Return type

**{ [key: string]: boolean; }**

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

# **checkUsernameExists**
> { [key: string]: boolean; } checkUsernameExists()


### Example

```typescript
import {
    UserManagementApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

let username: string; // (default to undefined)

const { status, data } = await apiInstance.checkUsernameExists(
    username
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **username** | [**string**] |  | defaults to undefined|


### Return type

**{ [key: string]: boolean; }**

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

# **deleteCurrentUser**
> { [key: string]: string; } deleteCurrentUser()


### Example

```typescript
import {
    UserManagementApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

const { status, data } = await apiInstance.deleteCurrentUser();
```

### Parameters
This endpoint does not have any parameters.


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

# **getAllUsers**
> Array<UserDto> getAllUsers()


### Example

```typescript
import {
    UserManagementApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

const { status, data } = await apiInstance.getAllUsers();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**Array<UserDto>**

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

# **getCurrentUser**
> UserDto getCurrentUser()


### Example

```typescript
import {
    UserManagementApi,
    Configuration
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

const { status, data } = await apiInstance.getCurrentUser();
```

### Parameters
This endpoint does not have any parameters.


### Return type

**UserDto**

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

# **updateCurrentUser**
> UserDto updateCurrentUser(userRequest)


### Example

```typescript
import {
    UserManagementApi,
    Configuration,
    UserRequest
} from '@disscount/api-client';

const configuration = new Configuration();
const apiInstance = new UserManagementApi(configuration);

let userRequest: UserRequest; //

const { status, data } = await apiInstance.updateCurrentUser(
    userRequest
);
```

### Parameters

|Name | Type | Description  | Notes|
|------------- | ------------- | ------------- | -------------|
| **userRequest** | **UserRequest**|  | |


### Return type

**UserDto**

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

