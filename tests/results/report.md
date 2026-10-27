# Test results

Generated: 2026-10-25T13:04:36.484Z

Passed 33, failed 0, skipped 0 of 33.

| # | Project | Test | Result | Time |
| --- | --- | --- | --- | --- |
| 1 | it | GET /auth/me › [LB-96] without a session cookie it answers 401 | passed | 34 ms |
| 2 | it | GET /auth/me › [LB-95][LB-96] a session with days left is not rotated, and the answer is not cached | passed | 473 ms |
| 3 | it | session and hint cookies › [LB-96] a rotation sets lb_session (HttpOnly) and the lb_signed_in hint (readable) for 7 days | passed | 416 ms |
| 4 | it | session and hint cookies › [LB-96] /auth/me is never cached, also when it rotates the session | passed | 276 ms |
| 5 | it | session and hint cookies › [LB-96] logout revokes the session and clears both cookies | passed | 237 ms |
| 6 | it | Google sign-in redirect › [LB-98] /auth/login sends the browser to Cognito for Google and asks for the account chooser | passed | 24 ms |
| 7 | it | Google sign-in redirect › [LB-98] @external Cognito managed login passes prompt=select_account on to Google | passed | 630 ms |
| 8 | it | session rotation in AuthGuard › [LB-95] a session with under 2 hours left is rotated: new cookies, new row, old row shortened | passed | 463 ms |
| 9 | it | session rotation in AuthGuard › [LB-95] the new session works, lasts 7 days and is not rotated again | passed | 364 ms |
| 10 | it | session rotation in AuthGuard › [LB-95] the old session still works during the grace period and is not rotated again | passed | 498 ms |
| 11 | it | session rotation in AuthGuard › [LB-95] after the grace period the old session is rejected | passed | 352 ms |
| 12 | it | session rotation in AuthGuard › [LB-95] parallel requests with one old token create exactly one new session | passed | 511 ms |
| 13 | it | session rotation in AuthGuard › [LB-95] a session with 3 hours left is not rotated | passed | 191 ms |
| 14 | it | session rotation in AuthGuard › [LB-95] an expired session is rejected and not rotated | passed | 188 ms |
| 15 | it | session rotation in AuthGuard › [LB-95] a revoked session is rejected and not rotated | passed | 239 ms |
| 16 | it | two users on one device › [LB-96] each session answers with its own user | passed | 481 ms |
| 17 | it | two users on one device › [LB-96] logging out one user leaves the other user signed in | passed | 401 ms |
| 18 | it | two users on one device › [LB-95] rotating one user session does not touch the other user | passed | 425 ms |
| 19 | e2e | Google sign-in › [LB-98] @external Continue with Google reaches Google with the account chooser requested | passed | 1779 ms |
| 20 | e2e | guest on a phone › [LB-97] opening the app makes no /auth/me request | passed | 1529 ms |
| 21 | e2e | guest on a phone › [LB-97] opening /merchant lands on the login page | passed | 1448 ms |
| 22 | e2e | hint cookie without a valid session › [LB-97] opening the app asks /auth/me exactly once | passed | 1630 ms |
| 23 | e2e | hint cookie without a valid session › [LB-97] a dead session: the public page stays, /merchant goes to login and stays there | passed | 2721 ms |
| 24 | e2e | hint cookie without a valid session › [LB-97] with the API down /merchant shows the error page, and retry works once it is back | passed | 2374 ms |
| 25 | e2e | hint cookie without a valid session › [LB-97] a 500 from /auth/me shows the error page, not login | passed | 1280 ms |
| 26 | e2e | hint cookie without a valid session › [LB-97] the login page with the API down shows the error, keeps Google usable, and retry clears it | passed | 1390 ms |
| 27 | e2e | hint cookie without a valid session › [LB-97] the login page hydrates cleanly while the session check is still running | passed | 3262 ms |
| 28 | e2e | two users on one browser, one after the other › [LB-96][LB-97][LB-98] user A signs out, user B signs in: B is B, and A is not let back in | passed | 3166 ms |
| 29 | e2e | two users on one browser, one after the other › [LB-96] two browsers at once each keep their own user | passed | 299 ms |
| 30 | e2e | signed-in user › [LB-97] sees /merchant after exactly one /auth/me request | passed | 1731 ms |
| 31 | e2e | signed-in user › [LB-97] opening /login is sent on to the redirect path, with no hydration warning | passed | 1258 ms |
| 32 | e2e | signed-in user › [LB-95][LB-96] a session with under 2 hours left is rotated while /merchant opens | passed | 1529 ms |
| 33 | e2e | signed-in user › [LB-96][LB-97] after the API logs the user out, /merchant goes to login and the cookies are gone | passed | 1657 ms |

## 1. GET /auth/me › [LB-96] without a session cookie it answers 401

- Project: it
- File: it/auth-me.spec.ts
- Result: passed (34 ms)

**response**

```
{
  "status": 401,
  "body": {
    "message": "Authentication is required",
    "error": "Unauthorized",
    "statusCode": 401
  }
}
```

## 2. GET /auth/me › [LB-95][LB-96] a session with days left is not rotated, and the answer is not cached

- Project: it
- File: it/auth-me.spec.ts
- Result: passed (473 ms)

**response**

```
{
  "status": 200,
  "headers": {
    "x-powered-by": "Express",
    "access-control-allow-origin": "http://localhost:5173",
    "vary": "Origin",
    "access-control-allow-credentials": "true",
    "cache-control": "no-store",
    "content-type": "application/json; charset=utf-8",
    "content-length": "125",
    "etag": "W/\"7d-VFD5a3AbiKCOVMxNDm+GM231+0g\"",
    "date": "Sun, 25 Oct 2026 13:04:02 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5"
  }
}
```

## 3. session and hint cookies › [LB-96] a rotation sets lb_session (HttpOnly) and the lb_signed_in hint (readable) for 7 days

- Project: it
- File: it/cookies.spec.ts
- Result: passed (416 ms)

**cookies**

```
{
  "session": {
    "value": "POZXoXags6uwqMcxVY3bEJLHWUlafOMvsyCa3Z0mZgQ",
    "httpOnly": true,
    "secure": false,
    "path": "/",
    "expires": "2026-11-01T13:04:02.000Z",
    "sameSite": "lax"
  },
  "hint": {
    "value": "1",
    "httpOnly": false,
    "secure": false,
    "maxAge": 604799,
    "path": "/",
    "expires": "2026-11-01T13:04:02.000Z",
    "sameSite": "lax"
  },
  "cacheControl": "no-store"
}
```

## 4. session and hint cookies › [LB-96] /auth/me is never cached, also when it rotates the session

- Project: it
- File: it/cookies.spec.ts
- Result: passed (276 ms)

## 5. session and hint cookies › [LB-96] logout revokes the session and clears both cookies

- Project: it
- File: it/cookies.spec.ts
- Result: passed (237 ms)

**logout**

```
{
  "status": 204,
  "cleared": [
    "lb_session",
    "lb_signed_in"
  ],
  "revokedAt": "2026-10-25T13:04:03.289Z",
  "meAfterLogout": 401
}
```

## 6. Google sign-in redirect › [LB-98] /auth/login sends the browser to Cognito for Google and asks for the account chooser

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (24 ms)

**authorize url**

```
{
  "status": 302,
  "host": "lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com",
  "params": {
    "client_id": "1b33vuogfdig1er3opcail7uba",
    "identity_provider": "Google",
    "nonce": "4ss11q_fdK1hFl8sFbKzxJjrib8z1iNLQNBbm77EfOk",
    "prompt": "select_account",
    "redirect_uri": "http://localhost:3000/auth/callback",
    "response_type": "code",
    "scope": "openid email profile",
    "state": "YytXZlbwqFJ_qqzl8iJ1_OERdGoYq3KFRC-A_a0QBG0"
  }
}
```

## 7. Google sign-in redirect › [LB-98] @external Cognito managed login passes prompt=select_account on to Google

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (630 ms)

**cognito to google**

```
{
  "status": 302,
  "host": "accounts.google.com",
  "prompt": "select_account"
}
```

## 8. session rotation in AuthGuard › [LB-95] a session with under 2 hours left is rotated: new cookies, new row, old row shortened

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (463 ms)

**rotation**

```
{
  "status": 200,
  "setCookies": [
    "lb_session",
    "lb_signed_in"
  ],
  "sessions": [
    {
      "expiresAt": "2026-10-25T13:06:04.384Z",
      "revokedAt": null
    },
    {
      "expiresAt": "2026-11-01T13:04:04.447Z",
      "revokedAt": null
    }
  ]
}
```

## 9. session rotation in AuthGuard › [LB-95] the new session works, lasts 7 days and is not rotated again

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (364 ms)

**new session**

```
{
  "status": 200,
  "msLeft": 604799850,
  "setCookies": []
}
```

## 10. session rotation in AuthGuard › [LB-95] the old session still works during the grace period and is not rotated again

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (498 ms)

**old token in grace**

```
{
  "status": 200,
  "setCookies": []
}
```

## 11. session rotation in AuthGuard › [LB-95] after the grace period the old session is rejected

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (352 ms)

**old token after grace**

```
{
  "status": 401
}
```

## 12. session rotation in AuthGuard › [LB-95] parallel requests with one old token create exactly one new session

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (511 ms)

**parallel**

```
{
  "statuses": [
    200,
    200,
    200,
    200,
    200,
    200
  ],
  "withNewCookie": 1,
  "sessionRows": 2
}
```

## 13. session rotation in AuthGuard › [LB-95] a session with 3 hours left is not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (191 ms)

**3 hours left**

```
{
  "status": 200,
  "setCookies": []
}
```

## 14. session rotation in AuthGuard › [LB-95] an expired session is rejected and not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (188 ms)

**expired**

```
{
  "status": 401,
  "setCookies": []
}
```

## 15. session rotation in AuthGuard › [LB-95] a revoked session is rejected and not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (239 ms)

**revoked**

```
{
  "status": 401,
  "setCookies": []
}
```

## 16. two users on one device › [LB-96] each session answers with its own user

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (481 ms)

**identities**

```
{
  "alice": "it-07655456bcd1@example.test",
  "bob": "it-551105284532@example.test"
}
```

## 17. two users on one device › [LB-96] logging out one user leaves the other user signed in

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (401 ms)

**after alice logs out**

```
{
  "alice": 401,
  "bob": 200,
  "aliceRevoked": true,
  "bobRevoked": false
}
```

## 18. two users on one device › [LB-95] rotating one user session does not touch the other user

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (425 ms)

**rotation**

```
{
  "aliceGotNewCookie": true,
  "bobSessionRows": 1
}
```

## 19. Google sign-in › [LB-98] @external Continue with Google reaches Google with the account chooser requested

- Project: e2e
- File: e2e/google-chooser.spec.ts
- Result: passed (1779 ms)

![screenshot](screenshots/19-screenshot-0.png)

## 20. guest on a phone › [LB-97] opening the app makes no /auth/me request

- Project: e2e
- File: e2e/guest.spec.ts
- Result: passed (1529 ms)

![screenshot](screenshots/20-screenshot-0.png)

## 21. guest on a phone › [LB-97] opening /merchant lands on the login page

- Project: e2e
- File: e2e/guest.spec.ts
- Result: passed (1448 ms)

![screenshot](screenshots/21-screenshot-0.png)

## 22. hint cookie without a valid session › [LB-97] opening the app asks /auth/me exactly once

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (1630 ms)

![screenshot](screenshots/22-screenshot-0.png)

## 23. hint cookie without a valid session › [LB-97] a dead session: the public page stays, /merchant goes to login and stays there

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (2721 ms)

![screenshot](screenshots/23-screenshot-0.png)

## 24. hint cookie without a valid session › [LB-97] with the API down /merchant shows the error page, and retry works once it is back

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (2374 ms)

![screenshot](screenshots/24-screenshot-0.png)

## 25. hint cookie without a valid session › [LB-97] a 500 from /auth/me shows the error page, not login

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (1280 ms)

![screenshot](screenshots/25-screenshot-0.png)

## 26. hint cookie without a valid session › [LB-97] the login page with the API down shows the error, keeps Google usable, and retry clears it

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (1390 ms)

![screenshot](screenshots/26-screenshot-0.png)

## 27. hint cookie without a valid session › [LB-97] the login page hydrates cleanly while the session check is still running

- Project: e2e
- File: e2e/hint-cookie.spec.ts
- Result: passed (3262 ms)

![screenshot](screenshots/27-screenshot-0.png)

## 28. two users on one browser, one after the other › [LB-96][LB-97][LB-98] user A signs out, user B signs in: B is B, and A is not let back in

- Project: e2e
- File: e2e/shared-device.spec.ts
- Result: passed (3166 ms)

![screenshot](screenshots/28-screenshot-0.png)

## 29. two users on one browser, one after the other › [LB-96] two browsers at once each keep their own user

- Project: e2e
- File: e2e/shared-device.spec.ts
- Result: passed (299 ms)

## 30. signed-in user › [LB-97] sees /merchant after exactly one /auth/me request

- Project: e2e
- File: e2e/signed-in.spec.ts
- Result: passed (1731 ms)

![screenshot](screenshots/30-screenshot-0.png)

## 31. signed-in user › [LB-97] opening /login is sent on to the redirect path, with no hydration warning

- Project: e2e
- File: e2e/signed-in.spec.ts
- Result: passed (1258 ms)

![screenshot](screenshots/31-screenshot-0.png)

## 32. signed-in user › [LB-95][LB-96] a session with under 2 hours left is rotated while /merchant opens

- Project: e2e
- File: e2e/signed-in.spec.ts
- Result: passed (1529 ms)

![screenshot](screenshots/32-screenshot-0.png)

## 33. signed-in user › [LB-96][LB-97] after the API logs the user out, /merchant goes to login and the cookies are gone

- Project: e2e
- File: e2e/signed-in.spec.ts
- Result: passed (1657 ms)

![screenshot](screenshots/33-screenshot-0.png)
