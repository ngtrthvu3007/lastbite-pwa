# Làm việc với database

Hướng dẫn thao tác với Postgres của `lb-api`: kết nối, đổi schema, migration, rollback.
Cách chạy dự án nói chung xem `README.md`. Quy tắc duyệt thay đổi xem `AGENTS.md`.

Mọi lệnh chạy trong `apps/lb-api/`, dùng PowerShell.

## 1. Tổng quan

- Postgres là nơi lưu dữ liệu chính (user, session, sau này là store, post, reservation).
  - Redis chỉ lưu dữ liệu tạm (OAuth state), không lưu dữ liệu lâu dài.
- **Drizzle** vừa là ORM (truy vấn trong code) vừa là công cụ migration (`drizzle-kit`).
- Các file quan trọng:
  - `src/db/schema.ts`: định nghĩa bảng, nguồn sự thật của schema.
  - `src/db/database.module.ts`: tạo kết nối, cung cấp token `DB` cho các service.
  - `src/db/database.config.ts`: đọc `DATABASE_URL` và cấu hình SSL.
  - `drizzle.config.ts`: cấu hình cho `drizzle-kit` (đọc `.env` rồi lấy `DATABASE_URL`).
  - `drizzle/*.sql`: các migration đã sinh ra. `drizzle/meta/`: journal và snapshot.
- Các bảng hiện có:
  - `users`: tài khoản (email unique, tên, ảnh).
  - `auth_identities`: liên kết user với danh tính Cognito (`provider` + `provider_subject` unique).
  - `auth_sessions`: session LastBite (chỉ lưu hash của token, hạn tối đa 7 ngày).

## 2. Kết nối

- Biến `DATABASE_URL` trong `apps/lb-api/.env` quyết định **cả API lẫn mọi lệnh Drizzle** chạy vào database nào.
  - Kiểm tra giá trị này trước mỗi lệnh `db:*`, nhất là khi đang trỏ vào Supabase.
- Local (Docker): chạy `docker compose up -d postgres` ở thư mục gốc, rồi dùng
  `postgresql://lastbite:change-me@localhost:54320/lastbite` và `APP_ENV=development`.
  - Các giá trị local mặc định nằm trong `docker-compose.yml`.
- Hosted (Supabase): dùng chuỗi **pooler** trong Project Settings, `APP_ENV` khác `development`.
- `APP_ENV=development` tắt SSL; mọi giá trị khác bật SSL.
- Chi tiết các biến môi trường khác xem `README.md`, mục Environment Configuration.

## 3. Đổi schema (quy trình chuẩn)

- **Xin duyệt trước.** `AGENTS.md` yêu cầu duyệt rõ ràng trước khi sửa schema hay migration.
- Sửa `src/db/schema.ts`.
- Sinh migration:
  - `npm run db:gen -- <ten_ngan_gon>`, ví dụ `npm run db:gen -- add_stores_table`.
  - Tên nên mô tả thay đổi, viết thường, nối bằng `_`.
- **Đọc file SQL vừa sinh** trong `drizzle/`. Kiểm tra có câu `DROP` hay `ALTER ... NOT NULL` nào có thể mất dữ liệu.
- Áp migration vào database trong `DATABASE_URL`:
  - `npm run db:migrate`
- Commit cùng lúc: `schema.ts`, file `drizzle/<số>_<tên>.sql` và thay đổi trong `drizzle/meta/`.
  - Thiếu `meta/` thì lần `db:gen` sau của người khác sẽ sinh sai.
- Kiểm tra schema và migration đã khớp nhau:
  - `npx drizzle-kit generate` phải báo `No schema changes, nothing to migrate`.
  - Nếu nó sinh ra file mới, nghĩa là bạn đã sửa `schema.ts` mà chưa sinh migration (hoặc ngược lại).

## 4. Xem database

- `npm run db:studio`: mở Drizzle Studio xem và sửa dữ liệu của database trong `DATABASE_URL`.
  - Không sửa tay dữ liệu trên database dùng chung nếu chưa hỏi.
- Xem migration nào đã áp: Drizzle ghi vào bảng `drizzle.__drizzle_migrations`.
  - Ví dụ: `select * from drizzle.__drizzle_migrations order by id;`

## 5. Hoàn tác (rollback)

- Drizzle **không có migration "down"**. Muốn hoàn tác một thay đổi đã áp: viết thay đổi ngược lại trong `schema.ts` rồi sinh migration mới.
- `npm run db:revert` (tức `drizzle-kit drop`) **không đụng tới database**. Nó chỉ xoá một file migration trong `drizzle/` và dòng tương ứng trong journal.
  - Chỉ dùng cho migration **chưa áp** và **chưa push**, ví dụ sinh nhầm.
  - Với migration đã áp hoặc đã push thì không dùng.
- Không sửa nội dung một file migration đã áp hoặc đã push. Những người khác đã chạy bản cũ, nội dung đổi sẽ làm database mỗi nơi một khác.
- `npm run db:push` đẩy thẳng schema vào database, **bỏ qua migration**. Chỉ dùng cho thử nghiệm trên database local bỏ đi được. Không dùng trên database dùng chung.

## 6. Hai người cùng đổi schema (xung đột)

- Hai branch cùng sinh migration thì số thứ tự có thể trùng (ví dụ cùng là `0003`).
- Cách xử lý, làm trên branch đến sau:
  - Merge hoặc rebase branch chính vào branch của bạn.
  - Xoá migration và snapshot bạn đã sinh (bằng `db:revert`, hoặc xoá tay file `.sql`, snapshot và dòng journal).
  - Giữ nguyên thay đổi trong `schema.ts`, rồi chạy lại `npm run db:gen -- <tên>`.
  - Chạy `npx drizzle-kit generate` để chắc chắn không còn lệch.

## 7. Test và database

- Unit test mock drizzle, không cần database. CI cũng không có Postgres (xem `docs/ci.md`).
- Vì vậy các điều kiện thật của câu truy vấn (session hết hạn, đã thu hồi, ràng buộc unique, check constraint) **chưa được test tự động**.
  - Khi cần, dựng integration test với Postgres thật (Docker, cổng `54320`) và database riêng cho test.
  - Không chạy test trên database dùng chung.

## 8. Quy tắc cần nhớ

- Mọi thay đổi schema đều đi qua migration được commit. Không sửa schema bằng tay trên database dùng chung.
- Giữ dữ liệu hiện có, trừ khi được yêu cầu dọn dữ liệu (xem `AGENTS.md`).
- Trước khi chạy `db:migrate`, xác nhận lại `DATABASE_URL` đang trỏ vào đâu.
- Ràng buộc quan trọng (unique, check) viết trong `schema.ts`, không chỉ trong code ứng dụng.
- Thêm index chỉ khi có truy vấn thật cần, hoặc để đảm bảo unique.
