# Testing

The frontend uses Vitest with Testing Library, jsdom and MSW. The backend has its own JUnit suite on H2, covered in `AGENTS.md`. This file covers the frontend.

## Commands

Run from `frontend/`:

- `pnpm test` runs the whole suite once. CI runs the same command.
- `pnpm test:watch` reruns affected tests as files change.
- `pnpm test:coverage` writes a V8 coverage report to `frontend/coverage/`.
- `pnpm exec vitest run --project unit` or `--project dom` runs one half; a path argument (`pnpm test src/utils`) narrows it further.

Inside a git worktree, call `./node_modules/.bin/vitest run` instead, since the guard hook blocks `pnpm` there.

## Two projects

`vitest.config.mts` splits the suite by file extension:

- **`unit`** runs `*.test.ts` in plain Node. Utilities, schemas, formatting, offline queue logic. No DOM, so these start fast.
- **`dom`** runs `*.test.tsx` in jsdom. Components and hooks. Its files go through the React Compiler with the same options as `next.config.ts`, because the compiler changes when effects and memoised values rerun, and a test of uncompiled code can pass while production misbehaves.

A hook test is a `.tsx` file even when it renders no JSX of its own, because it needs the providers.

Both projects share `src/test/setup.ts`, which starts the MSW server. The `dom` project adds `src/test/setup-dom.ts`, which loads the jest-dom matchers and, after every test, unmounts what was rendered, clears cookies and web storage, and resets the API client's cached auth token and the session user it is checked against.

The time zone is pinned to `Europe/Zagreb` in the config. Most readers are in Croatia, and a zone with an offset catches UTC-versus-local mistakes that a UTC machine would hide.

## Where tests live

- Next to the file they test, named `<file>.test.ts` or `<file>.test.tsx`: `src/utils/price.ts` and `src/utils/price.test.ts`. No `__tests__` folders.
- Import the code under test through `@/`, even from the same folder. Feature folders move (the i18n rollout moved every route under `[locale]`), and an alias import survives a move that a relative one may not.
- A test file in `src/app/` never becomes a route, since only `page`, `layout`, `route` and the other special names do.
- Shared helpers live in `src/test/`. Keep fixtures that one file needs inside that file.

## Shared helpers

- **`render.tsx`**: `renderWithProviders(ui, { locale, queryClient })` and `renderHookWithProviders(hook, options)` wrap the real `NextIntlClientProvider`, with the real catalogs and the Zagreb time zone, and a fresh `QueryClient` with retries off. Croatian is the default. They also set `<html lang>`, which the API client sends as `Accept-Language`.
- **`msw-server.ts`**: the MSW server, with no handlers. Each test declares the endpoints it expects with `server.use(...)`. Any request nobody declared fails the test that made it, even when the code under test catches the network error, so a forgotten call cannot pass silently.
- **Navigation** has no shared mock yet. `@/i18n/navigation` hooks need a mounted App Router, so a component that uses them mocks the module in its test file: `vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }))`. Move it into `src/test/` once a second test needs the same mock.

## Writing a test

- **Test behaviour, not structure.** Query the way a person finds things: `getByRole` with the accessible name first, then `getByLabelText`, and `getByTestId` only as a last resort. A role query that cannot find a button is usually an accessibility bug.
- **Use real translations.** Render with the catalogs instead of mocking `useTranslations`, the way next-intl's testing guide does. Assert on the Croatian text the user sees, or pass `locale` to check another language.
- **Click with `userEvent.setup()`**, created before the action, and `await` every interaction.
- **Wait for async results** with `findBy*` or `waitFor`. Never wrap `render` in `act` yourself.
- **Mock the network with MSW,** not axios or the service module, so the real interceptors, headers and zod parsing run. The API client sends no token, so a test needs no session handler; to assert which account Spring would act as, call `actingAs(request)` from `test/backend-identity.ts` in the handler (it applies the backend proxy's identity rules against `serverSession`, see [BACKEND-PROXY.md](BACKEND-PROXY.md#10-testing)).
- **Mock modules only at a boundary** you cannot run: the better-auth session hook, the router, a hook that writes cookies and navigates. `vi.mock` must sit at the top of the file, and any variable its factory uses comes from `vi.hoisted`.
- **Control time** with `vi.useFakeTimers({ now })` and switch back in `afterEach`. Testing Library's `waitFor` only detects Jest's fake timers and hangs under Vitest's, so flush with `act(() => vi.advanceTimersByTimeAsync(0))` instead (see `shopping-lists/hooks.test.tsx`). If user-event clicks under fake timers, pass `advanceTimers: vi.advanceTimersByTime` to `userEvent.setup`, or the click waits for a timer that never fires.
- **Fake IndexedDB per module.** The offline tests replace `idb-keyval` with a `Map` (see `card-photo-outbox.test.ts`). That keeps unit tests fast and needs no extra dependency.
- jsdom has no `matchMedia`, `ResizeObserver`, `IntersectionObserver`, canvas or camera. Stub what a test needs with `vi.stubGlobal`; the config restores stubs after each test.

The config sets `restoreMocks`, `unstubEnvs` and `unstubGlobals`, and Vitest 5 clears mock calls before every test by default, so tests do not need their own cleanup for spies, stubs or env vars.

## What unit tests do not cover

- **Async Server Components, `generateMetadata` and server actions.** Vitest cannot render async Server Components (the Next.js testing guide says so too). Move the logic into a plain function and test that, and leave the page itself to end-to-end tests.
- **The proxy's `config.matcher`, the service worker, camera scanning, canvas images and pointer gestures.** These need a real browser or a production build. They are checked by hand for now (see `PWA.md` and `MOBILE-NAV.md`). The `proxy()` function itself runs in the `unit` project: `src/proxy.test.ts` calls it with a `NextRequest` and checks the status and `Location` it answers.
- **End-to-end flows.** There is no end-to-end suite yet. When one arrives, it goes in a top-level `frontend/e2e/` folder with `*.spec.ts` names, so it never mixes with Vitest's `*.test.*`.

## Dev test accounts and seed data

Manual checks and agents comparing screens use throwaway accounts on a local or dev database, never production. Their credentials live in `frontend/.env.local` as `DEV_ACCOUNT_EMAIL` and `DEV_ACCOUNT_PASSWORD`, plus an optional second pair, `DEV_ACCOUNT_2_EMAIL` and `DEV_ACCOUNT_2_PASSWORD`, used to open the first account's shared list as another person and to switch accounts.

Creating an account, once per database:

1. `POST <base-url>/api/auth/sign-up/email` with `{ "email", "password", "name" }` and an `Origin: <base-url>` header, so better-auth hashes the password itself. Sign-up still mails a verification link, which bounces for a made-up address; that is one send per account.
2. In that database, `update "user" set email_verified = true where email = '<address>';`. Sign-in refuses an unverified address and mails it another link, so do this before the first sign-in.

Filling it, from `frontend/`:

```bash
node scripts/seed-dev-account.mjs --base-url https://dev.disscount.me
```

Without `--base-url` the script targets `NEXT_PUBLIC_APP_URL`, and it refuses `disscount.me` and `www.disscount.me` (a trailing dot included). It signs in and creates everything through the app's own endpoints, so ids and business rules match what a real user produces: profile (username, generated avatar, onboarding done), pinned chains and places, favourite stores, 11 watched products, 4 shopping lists (one shared by link at shop level, some items ticked with the shop price), 3 loyalty cards with fake numbers (one pinned, with recent use dates and generated front and back photos when the server has card photos enabled), 2 contact messages and sessions from three devices. EANs and store codes are real cijene-api values, kept in `scripts/lib/dev-seed-data.mjs`. With the second pair set, that account gets a list of its own and ticks one item on the shared list.

A rerun only adds what is missing and prints what it added, so it is safe to run after a database reset or a fixture change. Two limits: contact messages go out only on a first seed (empty account), because the API cannot list them back, and the script signs its own session out so reruns leave no extra sessions.

Every row comes out stamped "now". To spread them over six weeks, run the optional back-dating SQL on the same database, once per account. It fails on an unknown address, and a rerun counts back from that day, so it moves the history forward:

```bash
ssh <server> "docker exec -i <dev-db-container> psql -U <db-user> -d <db-name> -v email=<address>" \
  < frontend/scripts/seed-dev-account-backdate.sql
```

It sets account, list, item, watchlist (three with a past price alert), card, contact and session dates, all in UTC to match the zone-less columns.

## Coverage

`pnpm test:coverage` measures every file under `src/` except tests, `src/test/` and the vendored `components/ui/`. Nothing fails on a percentage. Coverage is a map of what is untested, not a target, and a gate tends to reward shallow tests. Use the report to pick the next file worth testing: money, dates, auth and offline sync first.

## Gotchas

- Brackets and parentheses in a config glob are pattern syntax, so `include` or `exclude` patterns that name `[locale]` or `(user)` need escaping. A path passed on the command line is matched as plain text and needs nothing.
- `vi.mock` inside a `describe` or a function throws in Vitest 5. Keep it at the top of the file.
- jsdom 30 needs Node `^22.22.2`, `^24.15.0` or `>=26.0.0`, so Node 25 and early 24 releases cannot run the DOM tests. CI uses Node 24.
- A `.tsx` test that renders a component with `useForm` reads the same compiled code as production, so the `useWatch` and `useFormState` rules in `AGENTS.md` matter in tests too.
- `vitest.config.mts` sets an empty inline PostCSS config. Without it, a component that imports a library stylesheet (`react-image-crop/dist/ReactCrop.css`) makes Vite load the app's Tailwind PostCSS config, which fails under Vitest.

## Sources

- [Vitest projects](https://vitest.dev/guide/projects), [mocking](https://vitest.dev/guide/mocking) and the [v5 migration guide](https://vitest.dev/guide/migration)
- [Next.js: setting up Vitest](https://nextjs.org/docs/app/guides/testing/vitest)
- [next-intl: testing](https://next-intl.dev/docs/environments/testing)
- [TanStack Query: testing](https://tanstack.com/query/v5/docs/framework/react/guides/testing) and [TkDodo on testing React Query](https://tkdodo.eu/blog/testing-react-query)
- [MSW with Node](https://mswjs.io/docs/integrations/node)
- [Testing Library query priority](https://testing-library.com/docs/queries/about/#priority) and [user-event setup](https://testing-library.com/docs/user-event/setup)
- [Kent C. Dodds: Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests)
- [Formbricks' Vitest config](https://github.com/formbricks/formbricks/blob/main/apps/web/vite.config.mts), the model for the two-project split
