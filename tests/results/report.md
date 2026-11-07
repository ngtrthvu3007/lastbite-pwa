# Test results

Generated: 2026-10-31T16:58:22.497Z

Passed 10, failed 0, skipped 0 of 10.

| # | Project | Test | Result | Time |
| --- | --- | --- | --- | --- |
| 1 | e2e | Cửa hàng screens › [LB-104] a user without a store goes from MerchantHome to the empty screen, then to the form | passed | 6191 ms |
| 2 | e2e | Cửa hàng screens › [LB-104] a user with a store sees its details and no form | passed | 1301 ms |
| 3 | e2e | Cửa hàng screens › [LB-104] a guest opening the store screens is sent to login | passed | 1489 ms |
| 4 | e2e | create store form › [LB-104] an empty form shows an error under each field and sends no request | passed | 1344 ms |
| 5 | e2e | create store form › [LB-104] values that break the rules show the matching error and send no request | passed | 1376 ms |
| 6 | e2e | create store form › [LB-104] fixing a field clears its error and leaves the others | passed | 1349 ms |
| 7 | e2e | create store form › [LB-104] a valid form disables the fields and the button while saving, then goes to MerchantHome | passed | 1466 ms |
| 8 | e2e | create store form › [LB-104] a user who already has a store sees the banner with a link to it, and the form keeps its values | passed | 1406 ms |
| 9 | e2e | create store form › [LB-104] a validation error from the API shows under the field it names | passed | 1290 ms |
| 10 | e2e | create store form › [LB-104] a network failure shows a toast and the form keeps its values | passed | 1296 ms |

## 1. Cửa hàng screens › [LB-104] a user without a store goes from MerchantHome to the empty screen, then to the form

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (6191 ms)

![screenshot](screenshots/01-screenshot-0.png)

## 2. Cửa hàng screens › [LB-104] a user with a store sees its details and no form

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1301 ms)

![screenshot](screenshots/02-screenshot-0.png)

## 3. Cửa hàng screens › [LB-104] a guest opening the store screens is sent to login

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1489 ms)

![screenshot](screenshots/03-screenshot-0.png)

## 4. create store form › [LB-104] an empty form shows an error under each field and sends no request

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1344 ms)

![screenshot](screenshots/04-screenshot-0.png)

## 5. create store form › [LB-104] values that break the rules show the matching error and send no request

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1376 ms)

![screenshot](screenshots/05-screenshot-0.png)

## 6. create store form › [LB-104] fixing a field clears its error and leaves the others

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1349 ms)

![screenshot](screenshots/06-screenshot-0.png)

## 7. create store form › [LB-104] a valid form disables the fields and the button while saving, then goes to MerchantHome

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1466 ms)

![screenshot](screenshots/07-screenshot-0.png)

## 8. create store form › [LB-104] a user who already has a store sees the banner with a link to it, and the form keeps its values

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1406 ms)

![screenshot](screenshots/08-screenshot-0.png)

## 9. create store form › [LB-104] a validation error from the API shows under the field it names

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1290 ms)

![screenshot](screenshots/09-screenshot-0.png)

## 10. create store form › [LB-104] a network failure shows a toast and the form keeps its values

- Project: e2e
- File: e2e/store.spec.ts
- Result: passed (1296 ms)

![screenshot](screenshots/10-screenshot-0.png)
