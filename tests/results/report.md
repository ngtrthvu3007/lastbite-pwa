# Test results

Generated: 2026-10-29T15:26:09.334Z

Passed 64, failed 8, skipped 0 of 72.

| # | Project | Test | Result | Time |
| --- | --- | --- | --- | --- |
| 1 | it | what /auth/me returns › [LB-85] the body is the public user and nothing else | passed | 442 ms |
| 2 | it | what /auth/me returns › [LB-96] @finding a refused request is not cacheable either | failed | 22 ms |
| 3 | it | only the lb_session cookie authenticates › [LB-85] the token in a header or in the URL is not accepted | passed | 257 ms |
| 4 | it | only the lb_session cookie authenticates › [LB-85] the Cookie header is read by exact cookie name | passed | 342 ms |
| 5 | it | routes and methods › [LB-85] logout is POST only: a GET cannot sign the user out | passed | 151 ms |
| 6 | it | routes and methods › [LB-85] only the documented method answers on each auth route | passed | 11 ms |
| 7 | it | CORS for the web app › [LB-86] the preflight for a credentialed POST /auth/logout passes for the web origin | passed | 8 ms |
| 8 | it | GET /auth/me › [LB-96] without a session cookie it answers 401 | passed | 12 ms |
| 9 | it | GET /auth/me › [LB-88] CORS with credentials is pinned to the web origin, never echoing another origin | passed | 9 ms |
| 10 | it | GET /auth/me › [LB-95][LB-96] a session with days left is not rotated, and the answer is not cached | passed | 277 ms |
| 11 | it | GET /auth/callback refusals › [LB-89] a state that was never issued is rejected | passed | 14 ms |
| 12 | it | GET /auth/callback refusals › [LB-89] a callback without state, or with an empty state, is rejected | passed | 17 ms |
| 13 | it | GET /auth/callback refusals › [LB-89] a valid state without a code or an error is rejected | passed | 10 ms |
| 14 | it | GET /auth/callback refusals › [LB-89] the user denying access (error=access_denied) is rejected without a session | passed | 11 ms |
| 15 | it | GET /auth/callback refusals › [LB-89] a state works once: after a refusal the same state is already consumed | passed | 15 ms |
| 16 | it | GET /auth/callback refusals › [LB-89] a stolen callback state is single-use even with a different error | passed | 11 ms |
| 17 | it | GET /auth/callback refusals › [LB-89] the error text is returned as JSON, never as HTML | passed | 10 ms |
| 18 | it | GET /auth/callback refusals › [LB-89] @external Cognito refusing a bad code leaves no session and burns the state | passed | 1317 ms |
| 19 | it | GET /auth/callback refusals › [LB-89] @finding a callback from a browser that did not start the login is treated differently | failed | 48 ms |
| 20 | it | session and hint cookies › [LB-96] a rotation sets lb_session (HttpOnly) and the lb_signed_in hint (readable) for 7 days | passed | 435 ms |
| 21 | it | session and hint cookies › [LB-96] /auth/me is never cached, also when it rotates the session | passed | 303 ms |
| 22 | it | session and hint cookies › [LB-96] logout revokes the session and clears both cookies | passed | 218 ms |
| 23 | it | Google sign-in redirect › [LB-98] /auth/login sends the browser to Cognito for Google and asks for the account chooser | passed | 18 ms |
| 24 | it | Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with another site | passed | 7 ms |
| 25 | it | Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with protocol-relative URL | passed | 6 ms |
| 26 | it | Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with credentials in the URL | passed | 6 ms |
| 27 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a sub-domain-style suffix | passed | 7 ms |
| 28 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the web host as user info | passed | 7 ms |
| 29 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with another port | passed | 10 ms |
| 30 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the other scheme | passed | 7 ms |
| 31 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a javascript: URL | passed | 7 ms |
| 32 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a data: URL | passed | 6 ms |
| 33 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a backslash host | passed | 6 ms |
| 34 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a tab inside the slashes | passed | 6 ms |
| 35 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the web URL only in the query | passed | 5 ms |
| 36 | it | Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with an empty host | failed | 13 ms |
| 37 | it | Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with only two slashes | failed | 42 ms |
| 38 | it | Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a broken IPv6 host | failed | 41 ms |
| 39 | it | Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a space in the host | failed | 45 ms |
| 40 | it | Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a port out of range | failed | 42 ms |
| 41 | it | Google sign-in redirect › [LB-89] /auth/login rejects a returnTo sent twice | passed | 29 ms |
| 42 | it | Google sign-in redirect › [LB-89] /auth/login accepts no returnTo | passed | 9 ms |
| 43 | it | Google sign-in redirect › [LB-89] /auth/login accepts a relative path | passed | 7 ms |
| 44 | it | Google sign-in redirect › [LB-89] /auth/login accepts a path with query and fragment | passed | 9 ms |
| 45 | it | Google sign-in redirect › [LB-89] /auth/login accepts the full web URL | passed | 9 ms |
| 46 | it | Google sign-in redirect › [LB-89] the authorize URL ignores everything the client tries to set | passed | 14 ms |
| 47 | it | Google sign-in redirect › [LB-89] every login gets its own unguessable state and nonce | passed | 12 ms |
| 48 | it | Google sign-in redirect › [LB-98] @external Cognito managed login passes prompt=select_account on to Google | passed | 201 ms |
| 49 | it | POST /auth/logout › [LB-85] without any cookie it still answers 204 and clears both cookies | passed | 13 ms |
| 50 | it | POST /auth/logout › [LB-85] with a token nobody issued it answers 204 and clears both cookies | passed | 59 ms |
| 51 | it | POST /auth/logout › [LB-85] logging out twice is safe and keeps the first revoked_at | passed | 380 ms |
| 52 | it | POST /auth/logout › [LB-85] a revoked session is refused and is not renewed by the request | passed | 199 ms |
| 53 | it | POST /auth/logout › [LB-85] @finding logging out also ends the previous token still inside its grace period | failed | 594 ms |
| 54 | it | auth schema › [LB-83] auth_identities(provider, provider_subject) is unique | passed | 528 ms |
| 55 | it | auth schema › [LB-83] auth_sessions(token_hash) is unique | passed | 119 ms |
| 56 | it | auth schema › [LB-83] users.email is unique | passed | 229 ms |
| 57 | it | auth schema › [LB-83] the database refuses a session longer than 7 days | passed | 230 ms |
| 58 | it | auth schema › [LB-83] the database refuses a session that expires at or before its creation | passed | 314 ms |
| 59 | it | auth schema › [LB-83] deleting a user deletes the identities and sessions that belong to it | passed | 171 ms |
| 60 | it | auth schema › [LB-84] auth_sessions keeps no raw token and no Cognito refresh token column | passed | 69 ms |
| 61 | it | auth schema › [LB-84][LB-85] a session the API creates is stored only as the SHA-256 of its cookie token | passed | 365 ms |
| 62 | it | session rotation in AuthGuard › [LB-95] a session with under 2 hours left is rotated: new cookies, new row, old row shortened | passed | 446 ms |
| 63 | it | session rotation in AuthGuard › [LB-95] the new session works, lasts 7 days and is not rotated again | passed | 375 ms |
| 64 | it | session rotation in AuthGuard › [LB-95] the old session still works during the grace period and is not rotated again | passed | 507 ms |
| 65 | it | session rotation in AuthGuard › [LB-95] after the grace period the old session is rejected | passed | 372 ms |
| 66 | it | session rotation in AuthGuard › [LB-95] parallel requests with one old token create exactly one new session | passed | 395 ms |
| 67 | it | session rotation in AuthGuard › [LB-95] a session with 3 hours left is not rotated | passed | 142 ms |
| 68 | it | session rotation in AuthGuard › [LB-95] an expired session is rejected and not rotated | passed | 140 ms |
| 69 | it | session rotation in AuthGuard › [LB-95] a revoked session is rejected and not rotated | passed | 170 ms |
| 70 | it | two users on one device › [LB-96] each session answers with its own user | passed | 476 ms |
| 71 | it | two users on one device › [LB-96] logging out one user leaves the other user signed in | passed | 491 ms |
| 72 | it | two users on one device › [LB-95] rotating one user session does not touch the other user | passed | 409 ms |

## 1. what /auth/me returns › [LB-85] the body is the public user and nothing else

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (442 ms)

**body**

```
{
  "id": "dce5b848-7c04-43fc-9383-cde9c3cdadbe",
  "email": "it-772f23b9632c@example.test",
  "displayName": "IT user",
  "avatarUrl": null
}
```

## 2. what /auth/me returns › [LB-96] @finding a refused request is not cacheable either

- Project: it
- File: it/auth-contract.spec.ts
- Result: failed (22 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: "no-store"
Received: undefined
```

**headers**

```
{
  "x-powered-by": "Express",
  "access-control-allow-origin": "http://localhost:5173",
  "vary": "Origin",
  "access-control-allow-credentials": "true",
  "content-type": "application/json; charset=utf-8",
  "content-length": "80",
  "etag": "W/\"50-0pDgPcIX+i/6E5UICQwIrUdVFxQ\"",
  "date": "Thu, 29 Oct 2026 15:25:54 GMT",
  "connection": "keep-alive",
  "keep-alive": "timeout=5"
}
```

## 3. only the lb_session cookie authenticates › [LB-85] the token in a header or in the URL is not accepted

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (257 ms)

## 4. only the lb_session cookie authenticates › [LB-85] the Cookie header is read by exact cookie name

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (342 ms)

## 5. routes and methods › [LB-85] logout is POST only: a GET cannot sign the user out

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (151 ms)

## 6. routes and methods › [LB-85] only the documented method answers on each auth route

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (11 ms)

## 7. CORS for the web app › [LB-86] the preflight for a credentialed POST /auth/logout passes for the web origin

- Project: it
- File: it/auth-contract.spec.ts
- Result: passed (8 ms)

**preflight**

```
{
  "status": 204,
  "headers": {
    "x-powered-by": "Express",
    "access-control-allow-origin": "http://localhost:5173",
    "vary": "Origin, Access-Control-Request-Headers",
    "access-control-allow-credentials": "true",
    "access-control-allow-methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
    "content-length": "0",
    "date": "Thu, 29 Oct 2026 15:25:55 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5"
  }
}
```

## 8. GET /auth/me › [LB-96] without a session cookie it answers 401

- Project: it
- File: it/auth-me.spec.ts
- Result: passed (12 ms)

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

## 9. GET /auth/me › [LB-88] CORS with credentials is pinned to the web origin, never echoing another origin

- Project: it
- File: it/auth-me.spec.ts
- Result: passed (9 ms)

**response**

```
{
  "allowed": {
    "x-powered-by": "Express",
    "access-control-allow-origin": "http://localhost:5173",
    "vary": "Origin",
    "access-control-allow-credentials": "true",
    "content-type": "application/json; charset=utf-8",
    "content-length": "80",
    "etag": "W/\"50-0pDgPcIX+i/6E5UICQwIrUdVFxQ\"",
    "date": "Thu, 29 Oct 2026 15:25:55 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5"
  },
  "foreign": {
    "x-powered-by": "Express",
    "access-control-allow-origin": "http://localhost:5173",
    "vary": "Origin",
    "access-control-allow-credentials": "true",
    "content-type": "application/json; charset=utf-8",
    "content-length": "80",
    "etag": "W/\"50-0pDgPcIX+i/6E5UICQwIrUdVFxQ\"",
    "date": "Thu, 29 Oct 2026 15:25:55 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5"
  }
}
```

## 10. GET /auth/me › [LB-95][LB-96] a session with days left is not rotated, and the answer is not cached

- Project: it
- File: it/auth-me.spec.ts
- Result: passed (277 ms)

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
    "etag": "W/\"7d-i4Ri4krpHlbU38X0RYEjuN6QJ3s\"",
    "date": "Thu, 29 Oct 2026 15:25:55 GMT",
    "connection": "keep-alive",
    "keep-alive": "timeout=5"
  }
}
```

## 11. GET /auth/callback refusals › [LB-89] a state that was never issued is rejected

- Project: it
- File: it/callback.spec.ts
- Result: passed (14 ms)

**response**

```
{
  "status": 400,
  "body": {
    "message": "OAuth state is invalid or expired",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

## 12. GET /auth/callback refusals › [LB-89] a callback without state, or with an empty state, is rejected

- Project: it
- File: it/callback.spec.ts
- Result: passed (17 ms)

## 13. GET /auth/callback refusals › [LB-89] a valid state without a code or an error is rejected

- Project: it
- File: it/callback.spec.ts
- Result: passed (10 ms)

**response**

```
{
  "status": 400,
  "body": {
    "message": [
      "code should not be empty",
      "code must be a string"
    ],
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

## 14. GET /auth/callback refusals › [LB-89] the user denying access (error=access_denied) is rejected without a session

- Project: it
- File: it/callback.spec.ts
- Result: passed (11 ms)

## 15. GET /auth/callback refusals › [LB-89] a state works once: after a refusal the same state is already consumed

- Project: it
- File: it/callback.spec.ts
- Result: passed (15 ms)

**replay**

```
{
  "first": {
    "message": "OAuth login failed: access_denied",
    "error": "Bad Request",
    "statusCode": 400
  },
  "replay": {
    "message": "OAuth state is invalid or expired",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

## 16. GET /auth/callback refusals › [LB-89] a stolen callback state is single-use even with a different error

- Project: it
- File: it/callback.spec.ts
- Result: passed (11 ms)

## 17. GET /auth/callback refusals › [LB-89] the error text is returned as JSON, never as HTML

- Project: it
- File: it/callback.spec.ts
- Result: passed (10 ms)

**headers**

```
{
  "x-powered-by": "Express",
  "access-control-allow-origin": "http://localhost:5173",
  "vary": "Origin",
  "access-control-allow-credentials": "true",
  "content-type": "application/json; charset=utf-8",
  "content-length": "98",
  "etag": "W/\"62-1VMrugHD6+gjk68Tk++XDLBwkqo\"",
  "date": "Thu, 29 Oct 2026 15:25:55 GMT",
  "connection": "keep-alive",
  "keep-alive": "timeout=5"
}
```

## 18. GET /auth/callback refusals › [LB-89] @external Cognito refusing a bad code leaves no session and burns the state

- Project: it
- File: it/callback.spec.ts
- Result: passed (1317 ms)

**bad code**

```
{
  "first": {
    "status": 502,
    "body": {
      "message": "Cognito token exchange failed",
      "error": "Bad Gateway",
      "statusCode": 502
    }
  },
  "replay": {
    "status": 400,
    "body": {
      "message": "OAuth state is invalid or expired",
      "error": "Bad Request",
      "statusCode": 400
    }
  }
}
```

## 19. GET /auth/callback refusals › [LB-89] @finding a callback from a browser that did not start the login is treated differently

- Project: it
- File: it/callback.spec.ts
- Result: failed (48 ms)

```
Error: expect(received).not.toBe(expected) // Object.is equality

Expected: not "{\"message\":\"OAuth login failed: access_denied\",\"error\":\"Bad Request\",\"statusCode\":400}"
```

**same state, two browsers**

```
{
  "starter": {
    "message": "OAuth login failed: access_denied",
    "error": "Bad Request",
    "statusCode": 400
  },
  "stranger": {
    "message": "OAuth login failed: access_denied",
    "error": "Bad Request",
    "statusCode": 400
  }
}
```

## 20. session and hint cookies › [LB-96] a rotation sets lb_session (HttpOnly) and the lb_signed_in hint (readable) for 7 days

- Project: it
- File: it/cookies.spec.ts
- Result: passed (435 ms)

**cookies**

```
{
  "session": {
    "value": "7i2aRcjr-A2PesNjCE-GNAZ4tn4uVDyH9uyDg_4ILqw",
    "httpOnly": true,
    "secure": false,
    "path": "/",
    "expires": "2026-11-05T15:25:58.000Z",
    "sameSite": "lax"
  },
  "hint": {
    "value": "1",
    "httpOnly": false,
    "secure": false,
    "maxAge": 604799,
    "path": "/",
    "expires": "2026-11-05T15:25:58.000Z",
    "sameSite": "lax"
  },
  "cacheControl": "no-store"
}
```

## 21. session and hint cookies › [LB-96] /auth/me is never cached, also when it rotates the session

- Project: it
- File: it/cookies.spec.ts
- Result: passed (303 ms)

## 22. session and hint cookies › [LB-96] logout revokes the session and clears both cookies

- Project: it
- File: it/cookies.spec.ts
- Result: passed (218 ms)

**logout**

```
{
  "status": 204,
  "cleared": [
    "lb_session",
    "lb_signed_in"
  ],
  "revokedAt": "2026-10-29T15:25:58.553Z",
  "meAfterLogout": 401
}
```

## 23. Google sign-in redirect › [LB-98] /auth/login sends the browser to Cognito for Google and asks for the account chooser

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (18 ms)

**authorize url**

```
{
  "status": 302,
  "host": "lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com",
  "params": {
    "client_id": "1b33vuogfdig1er3opcail7uba",
    "identity_provider": "Google",
    "nonce": "aanh4KGCKuStdHQCfYH8B6n3KmJKGtm1w_tuS8BaAjw",
    "prompt": "select_account",
    "redirect_uri": "http://localhost:3000/auth/callback",
    "response_type": "code",
    "scope": "openid email profile",
    "state": "9FDHhlSmGjJzs00iGV21crSZqfR6YfHiQyl21DlqLvk"
  }
}
```

## 24. Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with another site

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

**response**

```
{
  "returnTo": "https://evil.example/",
  "status": 400,
  "location": null
}
```

## 25. Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with protocol-relative URL

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (6 ms)

**response**

```
{
  "returnTo": "//evil.example/",
  "status": 400,
  "location": null
}
```

## 26. Google sign-in redirect › [LB-88] /auth/login rejects a returnTo with credentials in the URL

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (6 ms)

**response**

```
{
  "returnTo": "http://user:pass@localhost:5173/",
  "status": 400,
  "location": null
}
```

## 27. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a sub-domain-style suffix

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

**response**

```
{
  "returnTo": "http://localhost.evil.example:5173/",
  "status": 400
}
```

## 28. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the web host as user info

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

**response**

```
{
  "returnTo": "http://localhost:5173@evil.example/",
  "status": 400
}
```

## 29. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with another port

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (10 ms)

**response**

```
{
  "returnTo": "http://localhost:5174/",
  "status": 400
}
```

## 30. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the other scheme

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

**response**

```
{
  "returnTo": "https://localhost:5173/",
  "status": 400
}
```

## 31. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a javascript: URL

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

**response**

```
{
  "returnTo": "javascript:alert(1)",
  "status": 400
}
```

## 32. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a data: URL

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (6 ms)

**response**

```
{
  "returnTo": "data:text/html,x",
  "status": 400
}
```

## 33. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a backslash host

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (6 ms)

**response**

```
{
  "returnTo": "/\\evil.example",
  "status": 400
}
```

## 34. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with a tab inside the slashes

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (6 ms)

**response**

```
{
  "returnTo": "/\t/evil.example",
  "status": 400
}
```

## 35. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo with the web URL only in the query

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (5 ms)

**response**

```
{
  "returnTo": "https://evil.example/?next=http://localhost:5173",
  "status": 400
}
```

## 36. Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with an empty host

- Project: it
- File: it/login-redirect.spec.ts
- Result: failed (13 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

**response**

```
{
  "returnTo": "http://",
  "status": 500
}
```

## 37. Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with only two slashes

- Project: it
- File: it/login-redirect.spec.ts
- Result: failed (42 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

**response**

```
{
  "returnTo": "//",
  "status": 500
}
```

## 38. Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a broken IPv6 host

- Project: it
- File: it/login-redirect.spec.ts
- Result: failed (41 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

**response**

```
{
  "returnTo": "http://[",
  "status": 500
}
```

## 39. Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a space in the host

- Project: it
- File: it/login-redirect.spec.ts
- Result: failed (45 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

**response**

```
{
  "returnTo": "http://exa mple.com/",
  "status": 500
}
```

## 40. Google sign-in redirect › [LB-89] @finding /auth/login answers 400, not 500, for a returnTo with a port out of range

- Project: it
- File: it/login-redirect.spec.ts
- Result: failed (42 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 400
Received: 500
```

**response**

```
{
  "returnTo": "http://localhost:99999/",
  "status": 500
}
```

## 41. Google sign-in redirect › [LB-89] /auth/login rejects a returnTo sent twice

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (29 ms)

## 42. Google sign-in redirect › [LB-89] /auth/login accepts no returnTo

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (9 ms)

## 43. Google sign-in redirect › [LB-89] /auth/login accepts a relative path

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (7 ms)

## 44. Google sign-in redirect › [LB-89] /auth/login accepts a path with query and fragment

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (9 ms)

## 45. Google sign-in redirect › [LB-89] /auth/login accepts the full web URL

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (9 ms)

## 46. Google sign-in redirect › [LB-89] the authorize URL ignores everything the client tries to set

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (14 ms)

**authorize params**

```
{
  "client_id": "1b33vuogfdig1er3opcail7uba",
  "identity_provider": "Google",
  "nonce": "xvV_ozMEoPQhmYViC2AEBwWFBCuSqkdKt6HTg-_WywI",
  "prompt": "select_account",
  "redirect_uri": "http://localhost:3000/auth/callback",
  "response_type": "code",
  "scope": "openid email profile",
  "state": "2Z3nkre8-dtyh32RusmS8HDiUDeD-6SmrxXKq9FwHlU"
}
```

## 47. Google sign-in redirect › [LB-89] every login gets its own unguessable state and nonce

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (12 ms)

**lengths**

```
{
  "state": 43,
  "nonce": 43
}
```

## 48. Google sign-in redirect › [LB-98] @external Cognito managed login passes prompt=select_account on to Google

- Project: it
- File: it/login-redirect.spec.ts
- Result: passed (201 ms)

**cognito to google**

```
{
  "status": 302,
  "host": "accounts.google.com",
  "prompt": "select_account"
}
```

## 49. POST /auth/logout › [LB-85] without any cookie it still answers 204 and clears both cookies

- Project: it
- File: it/logout.spec.ts
- Result: passed (13 ms)

## 50. POST /auth/logout › [LB-85] with a token nobody issued it answers 204 and clears both cookies

- Project: it
- File: it/logout.spec.ts
- Result: passed (59 ms)

## 51. POST /auth/logout › [LB-85] logging out twice is safe and keeps the first revoked_at

- Project: it
- File: it/logout.spec.ts
- Result: passed (380 ms)

**revoked_at**

```
{
  "revokedAfterFirst": "2026-10-29T15:26:01.614Z",
  "revokedAfterSecond": "2026-10-29T15:26:01.614Z"
}
```

## 52. POST /auth/logout › [LB-85] a revoked session is refused and is not renewed by the request

- Project: it
- File: it/logout.spec.ts
- Result: passed (199 ms)

## 53. POST /auth/logout › [LB-85] @finding logging out also ends the previous token still inside its grace period

- Project: it
- File: it/logout.spec.ts
- Result: failed (594 ms)

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 401
Received: 200
```

**after logout**

```
{
  "withNew": 401,
  "withOld": 200
}
```

## 54. auth schema › [LB-83] auth_identities(provider, provider_subject) is unique

- Project: it
- File: it/schema.spec.ts
- Result: passed (528 ms)

## 55. auth schema › [LB-83] auth_sessions(token_hash) is unique

- Project: it
- File: it/schema.spec.ts
- Result: passed (119 ms)

## 56. auth schema › [LB-83] users.email is unique

- Project: it
- File: it/schema.spec.ts
- Result: passed (229 ms)

## 57. auth schema › [LB-83] the database refuses a session longer than 7 days

- Project: it
- File: it/schema.spec.ts
- Result: passed (230 ms)

## 58. auth schema › [LB-83] the database refuses a session that expires at or before its creation

- Project: it
- File: it/schema.spec.ts
- Result: passed (314 ms)

## 59. auth schema › [LB-83] deleting a user deletes the identities and sessions that belong to it

- Project: it
- File: it/schema.spec.ts
- Result: passed (171 ms)

## 60. auth schema › [LB-84] auth_sessions keeps no raw token and no Cognito refresh token column

- Project: it
- File: it/schema.spec.ts
- Result: passed (69 ms)

## 61. auth schema › [LB-84][LB-85] a session the API creates is stored only as the SHA-256 of its cookie token

- Project: it
- File: it/schema.spec.ts
- Result: passed (365 ms)

## 62. session rotation in AuthGuard › [LB-95] a session with under 2 hours left is rotated: new cookies, new row, old row shortened

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (446 ms)

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
      "expiresAt": "2026-10-29T15:28:05.350Z",
      "revokedAt": null
    },
    {
      "expiresAt": "2026-11-05T15:26:05.431Z",
      "revokedAt": null
    }
  ]
}
```

## 63. session rotation in AuthGuard › [LB-95] the new session works, lasts 7 days and is not rotated again

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (375 ms)

**new session**

```
{
  "status": 200,
  "msLeft": 604799828,
  "setCookies": []
}
```

## 64. session rotation in AuthGuard › [LB-95] the old session still works during the grace period and is not rotated again

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (507 ms)

**old token in grace**

```
{
  "status": 200,
  "setCookies": []
}
```

## 65. session rotation in AuthGuard › [LB-95] after the grace period the old session is rejected

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (372 ms)

**old token after grace**

```
{
  "status": 401
}
```

## 66. session rotation in AuthGuard › [LB-95] parallel requests with one old token create exactly one new session

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (395 ms)

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

## 67. session rotation in AuthGuard › [LB-95] a session with 3 hours left is not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (142 ms)

**3 hours left**

```
{
  "status": 200,
  "setCookies": []
}
```

## 68. session rotation in AuthGuard › [LB-95] an expired session is rejected and not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (140 ms)

**expired**

```
{
  "status": 401,
  "setCookies": []
}
```

## 69. session rotation in AuthGuard › [LB-95] a revoked session is rejected and not rotated

- Project: it
- File: it/session-rotation.spec.ts
- Result: passed (170 ms)

**revoked**

```
{
  "status": 401,
  "setCookies": []
}
```

## 70. two users on one device › [LB-96] each session answers with its own user

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (476 ms)

**identities**

```
{
  "alice": "it-2db795d51945@example.test",
  "bob": "it-588f5515989e@example.test"
}
```

## 71. two users on one device › [LB-96] logging out one user leaves the other user signed in

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (491 ms)

**after alice logs out**

```
{
  "alice": 401,
  "bob": 200,
  "aliceRevoked": true,
  "bobRevoked": false
}
```

## 72. two users on one device › [LB-95] rotating one user session does not touch the other user

- Project: it
- File: it/shared-device.spec.ts
- Result: passed (409 ms)

**rotation**

```
{
  "aliceGotNewCookie": true,
  "bobSessionRows": 1
}
```
