# API contract

How the frontend's zod schemas and the Spring backend stay in agreement. `contracts/backend-api.json` is generated from the backend and committed, and each side has a test against it, so a change on either side fails CI until both agree.

## 1. Why it exists

The frontend parses every backend response with zod, and a zod enum rejects a value it does not list. A new backend enum value therefore passes every backend test and then breaks each screen that receives it. The two sides used to be kept equal by hand: a comment saying "mirrors the backend enum" on the frontend, and field lists written out in the backend's wire format tests.

## 2. How it works

Three links, each with its own test:

- **Real responses match the contract.** The `*WireFormatTest` classes run the whole app on H2 and call `ApiContract.assertMatches("SomeDto", response)`, which compares the keys and fails on a null the contract does not declare, nested DTOs included.
- **The contract matches the backend.** `ApiContractTest` builds the contract again and compares it to the committed file. The schemas come from springdoc's `/v3/api-docs` (`components.schemas`, every DTO a controller names). The enums come from a classpath scan of `disscount`, leaving out test classes, because some enums are `String` fields on the wire (`ImageSource`, `ImageStatus`) and some are never in a DTO (`QueueFilter`).
- **The zod schemas match the contract.** `frontend/src/lib/api/schemas/backend-contract.test.ts` turns each zod schema into JSON Schema with `z.toJSONSchema` and compares field names, types, nullability, enum values and nested objects.

The frontend test also fails on anything unclassified: a new DTO or enum in the file must be added to the mirrored table or to the named "no zod schema" or "backend only" list.

Neither CI job needs the other's toolchain. The backend job has no Node and the frontend job has no Java, which is why the file is committed instead of generated during the frontend check.

## 3. Changing the API

1. Change the DTO or enum in Java. A field that can be null on the wire carries `@Schema(nullable = true)`; a required request field keeps its Bean Validation annotation, which springdoc turns into `required`.
2. Refresh the file: `cd backend && mvn -B test -Dtest=ApiContractTest -Dcontract.update=true`.
3. Update the zod schema until `pnpm test src/lib/api/schemas/backend-contract.test.ts` passes.
4. Commit the three together. The diff of `contracts/backend-api.json` shows a reviewer exactly what changed on the wire.

Never edit the JSON by hand. After a merge conflict in it, take either side and run step 2.

## 4. What it checks

Checked: field names on both sides, nested DTOs, arrays and maps, scalar type (a Java `integer` may be a zod `number`, not the reverse), nullability (next section), enum values, and the alternation regexes `DigitalCardRequest` uses in place of enums (`cardType`, `codeType`).

Mirrored schemas: every `*Dto` and `*Request` in `backend-contract.test.ts`, covering users, pinned stores and places, favorite stores, watchlist, shopping lists and items, digital cards, contact messages, store names and product images.

Mirrored enums: `AccountType`, `AcquisitionChannel`, `CardPhotoSlot`, `ImageSource`, `ImageStatus`, `LinkAccess`, `ListAccess`, `QueueFilter`, `WatchType`.

Nullability follows from how each direction travels. A DTO's direction comes from its name: `*Request` is a request, everything else a response.

- **Responses.** Spring sends every key, so a field is a value or null and never absent. Drift is a null the backend sends and zod rejects (`.optional()` does not count as accepting it, because that is what breaks a screen), a null zod allows and the backend never sends, or a key zod lets go missing.
- **Requests.** Jackson reads an absent field and a null one alike, so `.nullable()`, `.optional()` and `.nullish()` all mean "may be empty". Drift is a field with `required` in the contract that zod can leave empty, a null zod can send to a field the contract does not mark nullable, or a nullable field zod always demands a value for. A Java primitive is neither: leaving it out keeps its default, and sending null is rejected.

What counts as nullable comes from the code that fills the field: the entity column, the mapper (`ShoppingListDto.ownerId` is null for anyone but the owner) and the service (`UserDto.email` is null on `/me`). Only `@Schema(nullable = true)` reaches the file: springdoc 3.2.0 ignores JSpecify's `@Nullable`, and writes `type: ["string", "null"]` for a scalar or enum.

Gotchas:

- A nullable nested DTO comes out as `$ref` beside `type: "null"` (`AdminImageDto.crop`, `CropRequest.crop`). Both readers here treat that as nullable, but a strict OpenAPI 3.1 tool would read it as a schema nothing satisfies, so a client generator would need that shape fixed first.
- A nullable enum's `enum` list does not include null, for the same reason.
- An annotation is a claim, and the wire format tests only catch a missing one when a test response really holds that null.
- DTOs and request bodies are records with a static `from()`. Jackson 3 writes a record's keys in declaration order, as it did for the Lombok classes with a public all-args constructor (`UserDto`, `DigitalCardDto`, `CardPhotoDto`), but it wrote the `@Builder`-only classes alphabetically. springdoc (on its own Jackson 2) reads declaration order either way. The seven records that replaced `@Builder`-only classes carry `@AlphabeticalJson`, so their JSON bytes stayed the same; `JsonWireFormatTest` lists them. The order is cosmetic, and nothing on the frontend reads it.
- A paged response uses `disscount.shared.PageDto`: `{ items, page: { number, size, totalItems, totalPages } }`, with `number` counted from 0. On the frontend, `pageSchema(itemSchema)` in `lib/api/schemas/page.ts` builds the matching zod schema, and `.extend()` adds a field beside `page`, as the photo queue does with `reviewedCount`. The controller takes a `Pageable`; `spring.data.web.pageable.max-page-size=100` cuts a larger `size` down to 100, and the service passes it through `Paging.withoutClientSort`, so a `sort` parameter is ignored and each query keeps its own `order by`.
- The test `application.properties` replaces main's on the classpath, so a setting the tests must share with production (such as `spring.jpa.open-in-view=false` and the page size cap) goes in both files.
- A request field that may be missing must not be a Java primitive in a record: Jackson 3 refuses a missing primitive there with a 400. `ShoppingListCopyRequest` stays a class for that reason, so a missing flag still reads as false.

Not checked:

- **Null inside a list or map.** Elements and map values are compared for type only. No DTO has a nullable element today.
- **Validation limits.** Lengths and ranges are in the file but not compared with the zod form rules, which are deliberately their own thing.
- **URLs and status codes.** The file holds schemas only. Paths would add churn without protecting anything the zod schemas read.
- **Bodies with no zod schema.** `CardPinRequest`, `CropRequest` and the others on the list in the test are inline objects in the query functions.
- **Next.js routes.** `account-session`, `store-hours` and `store-directory` are served by the frontend's own API routes, and `lib/cijene-api/schemas.ts` mirrors an upstream API. None has a Spring DTO.

## 5. Accepted differences

`ACCEPTED_DRIFT` in the test lists each deliberate difference with its reason, and an entry that stops being different fails the test. Today:

- `UserDto.name`, `pinnedStores` and `pinnedPlaces` are filled on the client.
- `ShoppingListDto.linkAccess` is typed `ListAccess` in Java but never answers `OWNER`.
- `UserRequest.onboardingOutcome` and `ContactMessageRequest.email` are zod unions, which state a rule rather than one shape, so they are named instead of compared.
- The photo slot, card type, code type, image source and image status are zod enums over plain `String` fields in the response DTOs. The enum table and `DigitalCardRequest`'s regexes hold those values to the backend, one level away from the field itself. Typing the fields as enums in Java would let these entries go.

## 6. Key files

- `contracts/backend-api.json`: the generated contract.
- `backend/src/test/java/disscount/contract/ApiContractTest.java`: checks and refreshes it.
- `backend/src/test/java/disscount/support/ApiContract.java`: reads it for the wire format tests.
- `frontend/src/lib/api/schemas/backend-contract.test.ts`: the tables of mirrored schemas and enums.
- `frontend/src/test/api-contract.ts`: the comparison, with its own tests in `api-contract.test.ts`.
- `frontend/src/test/nullability-drift.ts`: the request and response nullability rules.

The JSON is read from disk rather than imported: the frontend image builds with only `frontend/` as its context, and `next build` type checks test files.

## 7. Future work

Generating the zod schemas from the OpenAPI document (for example with Hey API's zod plugin) would remove the hand-written copy altogether. It needs a dev dependency and a rewrite of schemas that carry form rules and message keys, so it has not been done.
