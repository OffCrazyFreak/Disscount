# API contract

How the frontend's zod schemas and the Spring backend stay in agreement. `contracts/backend-api.json` is generated from the backend and committed, and each side has a test against it, so a change on either side fails CI until both agree.

## 1. Why it exists

The frontend parses every backend response with zod, and a zod enum rejects a value it does not list. A new backend enum value therefore passes every backend test and then breaks each screen that receives it. The two sides used to be kept equal by hand: a comment saying "mirrors the backend enum" on the frontend, and field lists written out in the backend's wire format tests.

## 2. How it works

Three links, each with its own test:

- **Real responses match the contract.** The `*WireFormatTest` classes run the whole app on H2 and compare a response's keys to `ApiContract.fields("SomeDto")`.
- **The contract matches the backend.** `ApiContractTest` builds the contract again and compares it to the committed file. The schemas come from springdoc's `/v3/api-docs` (`components.schemas`, every DTO a controller names). The enums come from a classpath scan of `disscount`, because some enums are `String` fields on the wire (`ImageSource`, `ImageStatus`) and some are never in a DTO (`QueueFilter`).
- **The zod schemas match the contract.** `frontend/src/lib/api/schemas/backend-contract.test.ts` turns each zod schema into JSON Schema with `z.toJSONSchema` and compares field names, types, enum values and nested objects.

The frontend test also fails on anything unclassified: a new DTO or enum in the file must be added to the mirrored table or to the named "no zod schema" or "backend only" list.

Neither CI job needs the other's toolchain. The backend job has no Node and the frontend job has no Java, which is why the file is committed instead of generated during the frontend check.

## 3. Changing the API

1. Change the DTO or enum in Java.
2. Refresh the file: `cd backend && mvn -B test -Dtest=ApiContractTest -Dcontract.update=true`.
3. Update the zod schema until `pnpm test src/lib/api/schemas/backend-contract.test.ts` passes.
4. Commit the three together. The diff of `contracts/backend-api.json` shows a reviewer exactly what changed on the wire.

Never edit the JSON by hand. After a merge conflict in it, take either side and run step 2.

## 4. What it checks

Checked: field names on both sides, nested DTOs, arrays and maps, scalar type (a Java `integer` may be a zod `number`, not the reverse), enum values, and the alternation regexes `DigitalCardRequest` uses in place of enums (`cardType`, `codeType`).

Mirrored schemas: every `*Dto` and `*Request` in `backend-contract.test.ts`, covering users, pinned stores and places, favorite stores, watchlist, shopping lists and items, digital cards, contact messages, store names and product images.

Mirrored enums: `AccountType`, `AcquisitionChannel`, `CardPhotoSlot`, `ImageSource`, `ImageStatus`, `LinkAccess`, `ListAccess`, `QueueFilter`, `WatchType`.

Not checked:

- **Nullability.** springdoc does not mark a field nullable without an annotation on each one, so the file cannot say which fields may be null. The wire format tests pin the important nulls.
- **Validation limits.** Lengths and ranges are in the file but not compared with the zod form rules, which are deliberately their own thing.
- **URLs and status codes.** The file holds schemas only. Paths would add churn without protecting anything the zod schemas read.
- **Bodies with no zod schema.** `CardPinRequest`, `CropRequest` and the others on the list in the test are inline objects in the query functions.
- **Next.js routes.** `account-session`, `store-hours` and `store-directory` are served by the frontend's own API routes, and `lib/cijene-api/schemas.ts` mirrors an upstream API. None has a Spring DTO.

## 5. Accepted differences

`ACCEPTED_DRIFT` in the test lists each deliberate difference with its reason, and an entry that stops being different fails the test. Today: `UserDto.name`, `pinnedStores` and `pinnedPlaces` are filled on the client, and `ShoppingListDto.linkAccess` is typed `ListAccess` in Java but never answers `OWNER`.

## 6. Key files

- `contracts/backend-api.json`: the generated contract.
- `backend/src/test/java/disscount/contract/ApiContractTest.java`: checks and refreshes it.
- `backend/src/test/java/disscount/support/ApiContract.java`: reads it for the wire format tests.
- `frontend/src/lib/api/schemas/backend-contract.test.ts`: the tables of mirrored schemas and enums.
- `frontend/src/test/api-contract.ts`: the comparison, with its own tests in `api-contract.test.ts`.

The JSON is read from disk rather than imported: the frontend image builds with only `frontend/` as its context, and `next build` type checks test files.

## 7. Future work

Generating the zod schemas from the OpenAPI document (for example with Hey API's zod plugin) would remove the hand-written copy altogether. It needs a dev dependency and a rewrite of schemas that carry form rules and message keys, so it has not been done.
