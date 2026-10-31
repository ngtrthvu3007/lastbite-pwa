# LB-104 manual run: store screens and create form (Playwright MCP)

Date: 2026-10-31. Run by hand through the Playwright MCP browser, not by `npm test`. Google sign-in was done by the account owner in that browser; the agent drove the rest.

| Item | Value |
| --- | --- |
| Web | <http://localhost:5173> (`apps/lb-web`, dev server) |
| API | <http://localhost:3000> (`apps/lb-api`), local Postgres with migration `stores` applied |
| Screen | Chromium, viewport 412x915 |
| Auth | Real Google account through Cognito, so the real `lb_session` cookie and the real GraphQL calls |

Result: 11 of 11 checks passed. One of them failed first and was fixed during the run (M-07).

| # | Ticket | Check | Result |
| --- | --- | --- | --- |
| M-01 | LB-104 | Guest opens `/merchant/store`: lands on `/login?redirect=/merchant/store` | passed |
| M-02 | LB-104 | `/merchant` renders MerchantHome with the "Cửa hàng" link, no redirect to login | passed |
| M-03 | LB-103, LB-107 | "Cửa hàng" shows the empty screen; `myStore` answers `null` through the real session | passed |
| M-04 | LB-104 | "Tạo cửa hàng" opens `/merchant/store/new` with three labelled fields | passed |
| M-05 | LB-104 | Empty submit: an error under each field, no `createStore` request | passed |
| M-06 | LB-104 | Wrong values: the length messages carry the limits (2 to 100, 5 to 255), the phone error shows | passed |
| M-07 | LB-104 | Fixing one field clears its error and leaves the others | **failed, fixed** |
| M-08 | LB-103 | Phone with a symbol in place of a digit (07, vertical bar, 1234567) is refused in the form | passed |
| M-09 | LB-104 | Valid submit with `+84 912 345 678` lands on `/merchant` | passed |
| M-10 | LB-103, LB-104 | "Cửa hàng" shows the name, the phone as `0912345678` and the address, no owner field | passed |
| M-11 | LB-104 | Create a second store: the banner "Bạn đã có cửa hàng." with the "Xem cửa hàng" link, fields keep their values | passed |

## M-07 Fixing a field

First run: after a failed submit, a valid name left the old error on screen. Cause: the Vue Hook Form docs say `reValidateMode` defaults to `onChange`, but the library code does not apply that default, so a field is never validated again after the submit. Fix: `reValidateMode: "onChange"` is set in `apps/lb-web/app/composables/useStoreForm.ts`. Second run: the name error went away at once, the phone and address errors stayed.

## Screenshots

The evidence images (M-10 the store view, M-11 the "already exists" banner) are kept in Notion, in the Evidence section of the page [lb-web: store screens and create form (LB-104)](https://app.notion.com/p/40ac34fd446081b0964dc65b0bc215c1), not in this repository.

## Automated runs on the same day

| Run | Result |
| --- | --- |
| `npm run test:it -- store` (`it/store.spec.ts`) | 17 of 17 passed |
| `npm run test:e2e -- store` (`e2e/store.spec.ts`) | 10 of 10 passed. The first run had 9 passed and 1 failed (`fixing a field clears its error`): the test typed the fix before the submit had finished validating. The test now waits for the error first |
| `npm test` in `apps/lb-api` (store, validation error, `AuthGuard`, `CurrentUser`) | passed |

## Limits

- Not driven by hand because the e2e tests already cover them: the saving state (fields and button disabled), an API validation error shown under the field it names, a network failure with the toast.
- The user account used here now owns a store ("Bánh mì Cô Hai"). Delete the row from `stores` to see the empty screen again.
- `hasStore` from `/auth/me` and its cache are not tested: they wait for LB-17.
- Real Google sign-in is still not automated; a production build (`nuxt build`) is not covered.
