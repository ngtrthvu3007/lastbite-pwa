# Manual run: E2E and LB-98 check (Playwright MCP)

Date: 2026-10-25. Run by hand through the Playwright MCP browser, not by `npm test`, so it lives apart from `results/report.md` (the reporter wipes `results/screenshots/` on every run).

| Item | Value |
| --- | --- |
| Web | http://localhost:5173 (`apps/lb-web`, dev server) |
| API | http://localhost:3000 (`apps/lb-api`) |
| Screen | Chromium, viewport 412x915 (Pixel 7 size). Viewport only, no touch or mobile user agent |
| Code under test | LB-95, LB-96, LB-97 on disk. LB-98: Cognito already applied, API change (`prompt`) not on disk |
| Hint cookie | `lb_signed_in=1`, added by the test driver |
| Simulated | A signed-in answer (`200`) and a network failure are produced by intercepting `/auth/me`. Real Google sign-in is not automated |

Result: 8 of 8 E2E scenarios passed. No hydration warning in the console.

| # | Ticket | Scenario | Result |
| --- | --- | --- | --- |
| E2E-01 | LB-97 | Guest opens the app: no `/auth/me` request | passed |
| E2E-02 | LB-97 | Guest opens `/merchant`: lands on `/login?redirect=/merchant` | passed |
| E2E-03 | LB-97 | Hint cookie present, open the app: exactly one `/auth/me` | passed |
| E2E-04 | LB-97 | Hint cookie present, API down: error page instead of login, retry works | passed |
| E2E-05 | LB-97 | Dead session (401): public page stays, `/merchant` goes to login | passed |
| E2E-06 | LB-97 | Signed in (200): `/merchant` renders, `/login` bounces to the redirect | passed |
| E2E-07 | LB-97 | Login page with the API down: banner, retry, Google still usable | passed |
| E2E-08 | LB-97 | Login page, slow signed-in answer: no hydration warning, bounces to the redirect | passed |

## E2E-01 Guest opens the app

`/auth/me` requests: 0.

![E2E-01](screenshots/e2e-01-guest-home.png)

## E2E-02 Guest opens /merchant

URL `http://localhost:5173/login?redirect=/merchant`, Google button enabled, 0 `/auth/me` requests.

![E2E-02](screenshots/e2e-02-guest-merchant-login.png)

## E2E-03 Hint cookie present, open the app

`/auth/me` requests: 1 (the real API answers 401, so the visitor is a guest).

![E2E-03](screenshots/e2e-03-hint-home.png)

## E2E-04 Hint cookie present, API down

While the API is down, `/merchant` stays on `/merchant` and shows the error page.

![E2E-04 error page](screenshots/e2e-04-api-down-error-page.png)

After the API is back and "Thử lại" is pressed, the app lands on `/login?redirect=/merchant` (the session is not valid).

![E2E-04 after retry](screenshots/e2e-04-after-retry.png)

## E2E-05 Dead session (401)

Public `/` stays on `/`. `/merchant` goes to `/login?redirect=/merchant` and stays there (no loop).

![E2E-05](screenshots/e2e-05-dead-session-login.png)

## E2E-06 Signed in (200)

`/merchant` renders with one `/auth/me` request. `/login?redirect=/merchant` goes straight to `/merchant`.

![E2E-06](screenshots/e2e-06-signed-in-merchant.png)

## E2E-07 Login page with the API down

One error banner, one retry button, Google button enabled. After the API is back and retry is pressed, the banner is gone.

![E2E-07](screenshots/e2e-07-login-api-down.png)

## E2E-08 Login page, slow signed-in answer

The plugin is still fetching when the page hydrates (1.5 s delay). No hydration warning, and the page ends on `/merchant`.

![E2E-08](screenshots/e2e-08-login-slow-signed-in.png)

## LB-98 Cognito check (up to the Google page)

The API's `/auth/login` answered `302` to the Cognito domain `lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com`. The API on disk does not add `prompt` yet, so the authorize URL was built the way the API builds it and `prompt=select_account` was appended by hand.

| Case | Redirect chain | Google URL has `prompt` |
| --- | --- | --- |
| A. As the API builds it today | `302` Cognito `/oauth2/authorize`, `302` Google `/o/oauth2/v2/auth`, Google sign-in page | no |
| B. With `prompt=select_account` appended | same chain | **yes, `prompt=select_account`** |

Cognito (managed login) forwards `prompt` to Google, which is what LB-98 needs.

![A, without prompt](screenshots/lb98-a-without-prompt.png)

![B, with prompt](screenshots/lb98-b-with-prompt.png)

Limit: this browser has no Google session, so Google shows the sign-in page, not the account chooser. Seeing the chooser needs a normal browser that is signed in to at least one Google account.

## IT results (from `npm test`, 2026-10-25T09:29Z)

| Test | Result |
| --- | --- |
| `[LB-96]` `/auth/me` without a cookie answers 401 | passed |
| `[LB-95][LB-96]` a session with days left is not rotated, answer not cached | **failed** |

The failure is in the test database, not in the code: seeding a session failed with `null value in column "cognito_refresh_token_encrypted" of relation "auth_sessions" violates not-null constraint`. Migration `0002_drop_session_refresh_token.sql` drops that column, and the database used by the tests still has it. The API's own login inserts a session without that column, so signing in against this database would fail the same way. Run `npm run db:migrate` in `apps/lb-api` against that database, then rerun `npm run test:it`.

## Not covered

- Real Google sign-in, the account chooser itself, and the 5-minute chooser timeout (LB-98).
- Session rotation with parallel requests on a real Postgres (LB-95): blocked by the unmigrated test database above.
- A production build (`nuxt build`) and a real device or touch emulation.
