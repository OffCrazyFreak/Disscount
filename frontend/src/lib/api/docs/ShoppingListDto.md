# ShoppingListDto


## Properties

Name | Type | Description | Notes
------------ | ------------- | ------------- | -------------
**id** | **string** |  | [optional] [default to undefined]
**ownerId** | **string** |  | [optional] [default to undefined]
**title** | **string** |  | [optional] [default to undefined]
**isPublic** | **boolean** |  | [optional] [default to undefined]
**aiPrompt** | **string** |  | [optional] [default to undefined]
**aiAnswer** | **string** |  | [optional] [default to undefined]
**updatedAt** | **string** |  | [optional] [default to undefined]
**createdAt** | **string** |  | [optional] [default to undefined]
**items** | [**Array&lt;ShoppingListItemDto&gt;**](ShoppingListItemDto.md) |  | [optional] [default to undefined]

## Example

```typescript
import { ShoppingListDto } from '@disscount/api-client';

const instance: ShoppingListDto = {
    id,
    ownerId,
    title,
    isPublic,
    aiPrompt,
    aiAnswer,
    updatedAt,
    createdAt,
    items,
};
```

[[Back to Model list]](../README.md#documentation-for-models) [[Back to API list]](../README.md#documentation-for-api-endpoints) [[Back to README]](../README.md)
