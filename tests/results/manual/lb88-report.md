# LB-88 manual run: real Cognito and Google (Playwright MCP)

Date: 2026-10-29. Run by hand through the Playwright MCP browser. Google sign-in was done by the account owner in that browser; the agent drove the rest.

| Item | Value |
| --- | --- |
| Web | http://localhost:5173 (`apps/lb-web`, dev server) |
| API | http://localhost:3000 (`apps/lb-api`) |
| Screen | Chromium, viewport 412x915 |
| Auth | Cognito (Terraform-managed, managed login) with Google, real account |

| # | Check | Result |
| --- | --- | --- |
| M-01 | Guest opens `/merchant`: lands on `/login?redirect=/merchant` | passed |
| M-02 | Continue with Google reaches Google with `prompt=select_account` | passed |
| M-03 | After Google sign-in the browser lands on `/merchant`, page renders | passed |
| M-04 | `/auth/me` answers 200 with `Cache-Control: no-store` and the public user only (`id`, `email`, `displayName`, `avatarUrl`) | passed |
| M-05 | No Cognito token in the browser: `localStorage` and `sessionStorage` empty, `document.cookie` holds only `lb_signed_in=1` (`lb_session` is HttpOnly, so JS cannot read it) | passed |
| M-06 | `POST /auth/logout` answers 204, `document.cookie` is empty, `/auth/me` answers 401, `/merchant` goes back to `/login` | passed |
| M-07 | Second sign-in shows the Google account chooser (`/accountchooser`) | passed |
| M-08 | Second sign-in with the same Google account returns the same user `id` as the first (no duplicate user) | passed |

User id on both sign-ins: `535e4c38-3034-46a1-8dc9-d304c72e0f58`.

Screenshots:

![M-02 Google](screenshots/lb88-01-google-chooser.png)

![M-03/M-04 signed in](screenshots/lb88-02-merchant-signed-in.png)

![M-06 after logout](screenshots/lb88-03-after-logout.png)

![M-07 second sign-in](screenshots/lb88-04-google-second-login.png)

![M-08 second sign-in done](screenshots/lb88-05-second-login-merchant.png)

## Limits

- `lb_session` is HttpOnly, so this run could not read its value. That it is an opaque token (not a Cognito token) is shown by the IT `schema.spec.ts` (only a SHA-256 digest is stored) and by the code path: `callbackController` sets only the session token.
- The web app has no logout button yet (LB-97 out of scope), so logout was a `POST /auth/logout` from the page.
- Same `id` on both sign-ins is the evidence for "no duplicate user"; `users.email` is unique, so a second user row for the same email would have failed.
- The screenshots show the account owner's Google account name. Do not publish them outside the project.

## Bugs found alongside (see `report.md`)

LB-99 (500 on unparsable `returnTo`), LB-100 (OAuth state not tied to the browser), LB-101 (401 from `/auth/me` without `no-store`).
