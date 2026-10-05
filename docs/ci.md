# CI và quy trình PR

Workflow nằm ở `.github/workflows/ci.yml`. Đây là mô tả hiện trạng để làm việc
hằng ngày và để biết sửa ở đâu khi CI đỏ.

## Mục tiêu

- Chặn code lỗi lint, sai format hoặc không build được vào `main` và `dev`.
- Không có CD: chưa deploy gì. Làm sau khi `infra/`, `k8s/` và Dockerfile production có nội dung.

## Khi nào chạy

- PR vào `main` hoặc `dev`.
- Push vào `main` hoặc `dev` (tức là sau khi merge).
- Một PR mới có thể mất 1 đến 2 phút mới bắt đầu chạy; đó là độ trễ của GitHub, không phải lỗi.

## Chạy gì

- `lb-api`: eslint, prettier, unit test, e2e test, build.
- `lb-merchant`: oxlint, eslint, prettier, unit test, build (build đã gồm type-check).
- `lb-customer`: chỉ build, vì app chưa có lint, prettier hay test.
- Test chỉ chạy bằng dữ liệu giả, không cần Postgres, Redis hay Cognito thật.
  - Lý do: mọi client bên ngoài đều được mock. `lb-api` đọc `.env.test.local`, nên CI tự tạo file này với giá trị giả.

Các script `lint` và `format` trong `package.json` có `--fix` hoặc `--write`. CI không dùng chúng.
- Lý do: CI chỉ được báo lỗi, không tự sửa code rồi cho qua.

## Chỉ chạy app có thay đổi

- Job `changes` xem PR đụng vào thư mục app nào, các job app chỉ chạy khi app đó đổi.
- Sửa chính `ci.yml` thì cả ba app cùng chạy.
- App không đổi sẽ báo `Skipped`, và vẫn được tính là đạt.
- Lý do dùng `if:` ở cấp job thay vì `on.paths`: workflow bị `paths:` bỏ qua thì không tạo check nào,
  nên check bắt buộc sẽ treo chờ mãi và PR không merge được.

## Branch protection

`main` và `dev` đều được bảo vệ. Cài đặt ở GitHub, Settings, Branches.

- Phải qua PR, cần ít nhất 1 approve.
  - Lý do: không ai đẩy thẳng vào nhánh chính.
- Approve phải từ người khác người push cuối.
  - Lý do: tác giả không tự duyệt code của mình.
- Ba check bắt buộc: `lb-api`, `lb-merchant`, `lb-customer`.
  - Lý do: chặn merge khi build hoặc lint hỏng.
  - Đây là tên job trong `ci.yml`; đổi tên job thì phải chọn lại check trong rule.
- Branch phải cập nhật với base trước khi merge.
  - Lý do: tránh hai PR đều xanh nhưng gộp lại thì hỏng.
- Lịch sử tuyến tính: chỉ squash hoặc rebase merge, không dùng merge commit.
- Nên bật thêm: huỷ approve cũ khi có commit mới, bắt buộc giải quyết hết comment,
  cấm force push và cấm xoá branch.

Chủ repo mặc định có nút bypass các rule. Nếu chỉ có một người thì GitHub không cho tự approve PR của chính mình,
nên cần quyết định giữa: mời thêm reviewer, hoặc giữ bypass cho admin (tốt nhất là chỉ cho PR, không cho push thẳng).

## Quy trình làm việc

1. Tạo branch từ `dev`.
2. Commit rồi push: `git push -u origin HEAD`.
   - Lý do: branch tạo từ `origin/dev` bị gắn upstream là `dev`, `git push` trần sẽ báo lỗi.
3. Mở PR vào `dev`, chờ CI xanh và có approve.
4. Merge bằng squash.

## Chạy lại ở máy trước khi push

`lb-api` (trong `apps/lb-api`):

```sh
npx eslint "{src,apps,libs,test}/**/*.ts"
npx prettier --check "src/**/*.ts" "test/**/*.ts"
npm test
npm run test:e2e
npm run build
```

Test của `lb-api` cần `apps/lb-api/.env.test.local` (file này không commit, xem `.env.example`).

`lb-merchant` (trong `apps/lb-merchant`):

```sh
npx oxlint .
npx eslint .
npx prettier --check src/
npm run test:unit -- --run
npm run build
```

`lb-customer` (trong `apps/lb-customer`):

```sh
npm run build
```

Prettier báo lỗi thì chạy `npx prettier --write` đúng các đường dẫn trên rồi commit lại.

## Khi CI đỏ

- Job `Lint` hoặc `Prettier` đỏ: chạy lệnh tương ứng ở trên và sửa.
- Job `Unit tests` hoặc `E2E tests` đỏ: chạy lệnh test tương ứng ở trên. Test chạy tốt ở máy mà đỏ trên CI thường do thiếu biến môi trường trong `Create test env`.
- Job `Build` đỏ: chạy `npm run build` trong app đó.
- `npm ci` đỏ: `package.json` và `package-lock.json` đang lệch, chạy `npm install` trong app rồi commit lock file.
- Check không xuất hiện trên PR: kiểm tra tab Actions; nếu vẫn không có thì đóng rồi mở lại PR.

## Khi thay đổi CI

- Thêm app mới: thêm một mục trong bộ lọc của job `changes`, thêm job riêng cho app, rồi chọn job đó làm check bắt buộc.
- Đổi tên job: chọn lại check bắt buộc trong rule, tên cũ sẽ không còn chạy.
- Thêm biến môi trường mới mà test cần: thêm vào bước `Create test env` của job `lb-api`.
