# PageNotificationDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**totalPages** | **number** |  | [optional] [default to undefined]
**totalElements** | **number** |  | [optional] [default to undefined]
**size** | **number** |  | [optional] [default to undefined]
**content** | [**Array&lt;NotificationDto&gt;**](NotificationDto.md) |  | [optional] [default to undefined]
**number** | **number** |  | [optional] [default to undefined]
**sort** | [**SortObject**](SortObject.md) |  | [optional] [default to undefined]
**numberOfElements** | **number** |  | [optional] [default to undefined]
**pageable** | [**PageableObject**](PageableObject.md) |  | [optional] [default to undefined]
**first** | **boolean** |  | [optional] [default to undefined]
**last** | **boolean** |  | [optional] [default to undefined]
**empty** | **boolean** |  | [optional] [default to undefined]

## Example

```typescript
import { PageNotificationDto } from '@disscount/api-client';

const instance: PageNotificationDto = {
    totalPages,
    totalElements,
    size,
    content,
    number,
    sort,
    numberOfElements,
    pageable,
    first,
    last,
    empty,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
