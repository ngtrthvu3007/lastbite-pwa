# tests

Integration test (IT) và end-to-end test (E2E) cho LastBite, chạy bằng Playwright. Ứng dụng đang được test chỉ trên màn hình mobile.

| Project | Thư mục | Làm gì |
| --- | --- | --- |
| `it` | `it/` | Gọi thẳng API (không có trình duyệt). Seed user và session vào Postgres, dọn sau mỗi test |
| `e2e` | `e2e/` | Mở web app trong Chromium, viewport Pixel 7 (412x915) |

Test không tự bật app. Mày bật `apps/lb-api` và `apps/lb-web` trước, và API phải trỏ vào cùng database với `DATABASE_URL` trong `tests/.env`.

## Cài đặt

```powershell
cd tests
npm install
npx playwright install chromium
copy .env.example .env      # rồi điền DATABASE_URL
```

## Chạy

```powershell
npm test               # cả hai project
npm run test:it
npm run test:e2e
npm run test:offline   # bỏ các test gắn @external (cần Internet: Cognito, Google)
npm run typecheck
```

## Test case

| File | Ticket | Nội dung |
| --- | --- | --- |
| `it/auth-me.spec.ts` | LB-95, LB-96 | `/auth/me` không cookie (401); session còn nhiều ngày không rotation, `no-store` |
| `it/session-rotation.spec.ts` | LB-95 | Rotation khi còn dưới 2 giờ, session mới 7 ngày, grace period, hết grace bị từ chối, request song song chỉ một session mới, hết hạn và revoke bị từ chối |
| `it/cookies.spec.ts` | LB-96 | Thuộc tính `lb_session` và `lb_signed_in`, `no-store`, đăng xuất xoá cả hai cookie và revoke session |
| `it/login-redirect.spec.ts` | LB-98 | `/auth/login` chuyển sang Cognito kèm `prompt=select_account`; Cognito chuyển tiếp `prompt` sang Google (`@external`) |
| `e2e/guest.spec.ts` | LB-97 | Khách: không gọi `/auth/me`, `/merchant` về login |
| `e2e/hint-cookie.spec.ts` | LB-97 | Có hint nhưng không có session: một lần `/auth/me`, phiên chết, API lỗi, trang login, hydration |
| `e2e/signed-in.spec.ts` | LB-95, LB-96, LB-97 | Phiên thật seed vào DB: `/merchant`, `/login` chuyển tiếp, rotation trong trình duyệt, đăng xuất |
| `it/shared-device.spec.ts` | LB-95, LB-96 | Hai người dùng: mỗi session trả đúng user của mình, đăng xuất một người không đụng người kia, rotation của một người không đụng người kia |
| `e2e/shared-device.spec.ts` | LB-96, LB-97, LB-98 | Một trình duyệt: A đăng xuất rồi B đăng nhập thì `/auth/me` ra B và token cũ của A bị từ chối; hai trình duyệt cùng lúc giữ hai user riêng |
| `e2e/google-chooser.spec.ts` | LB-98 | Bấm Google tới được Google kèm `prompt=select_account` (`@external`) |

Cần đúng code của cả bốn ticket (nhánh test đã gộp LB-98) và API đã `db:migrate`. Test IT và `signed-in` ghi vào DB nên trỏ `DATABASE_URL` vào database dev, không phải production.

## Kết quả

Mỗi lần chạy ghi đè `results/report.md`: bảng tóm tắt, rồi mỗi test một mục có lỗi (nếu có), bằng chứng dạng text và ảnh chụp màn hình nhúng từ `results/screenshots/`. Báo cáo HTML đầy đủ nằm ở `playwright-report/` (không commit).

Xem báo cáo trên trình duyệt (cần `npm install -D docsify-cli` một lần): `npm run report`, rồi mở http://localhost:4000. Cổng 4000 để tránh trùng API (3000) và web (5173). Thanh bên có hai báo cáo: lần `npm test` mới nhất và lần chạy tay (`results/manual/`). Không cài thì mở `report.md` bằng xem trước markdown của VS Code (Ctrl+Shift+V).

## Viết test mới

- Đặt mã ticket trong tên test, ví dụ `[LB-95] ...`, để tìm lại trong báo cáo.
- IT: dùng `seedSession(expiresInMs)` trong `support/db.ts`, gọi API bằng fixture `request` với header `cookie: lb_session=<token>`, và luôn `deleteUser` trong `finally`. Dùng `test.info().attach('response', ...)` để đưa bằng chứng vào báo cáo.
- E2E: thêm cookie bằng `context.addCookies([buildHintCookie(baseURL)])` **trước** lần `goto` đầu tiên của test. Thêm cookie khi một trang khác còn mở có thể làm trang đó gọi API ngoài ý muốn. Ảnh chụp màn hình được lưu tự động sau mỗi test.
- Đăng nhập Google thật không tự động hoá được. Test các luồng sau đăng nhập bằng `seedSession` và cookie.
