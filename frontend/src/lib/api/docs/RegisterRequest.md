# RegisterRequest


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**username** | **string** |  | [default to undefined]
**email** | **string** |  | [default to undefined]
**password** | **string** |  | [default to undefined]
**stayLoggedInDays** | **number** |  | [optional] [default to undefined]
**notificationsPush** | **boolean** |  | [optional] [default to undefined]
**notificationsEmail** | **boolean** |  | [optional] [default to undefined]

## Example

```typescript
import { RegisterRequest } from '@disscount/api-client';

const instance: RegisterRequest = {
    username,
    email,
    password,
    stayLoggedInDays,
    notificationsPush,
    notificationsEmail,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
