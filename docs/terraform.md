# Terraform

Terraform cho LastBite, bám theo tiến độ code. Đây là tài liệu quyết định và quy trình;
cấu hình Cognito nằm trong `infra/cognito/`.

## Phạm vi hiện tại

- Chỉ Cognito, vì code auth của `lb-api` đang chỉ phụ thuộc đúng thứ này trên AWS.
  - Lý do: hạ tầng thêm theo nhu cầu thật của code, không dựng trước.
- Chưa làm: S3 ảnh sản phẩm, ECR, IAM cho GitHub Actions, chỗ chạy ứng dụng.
  - Mỗi thứ thêm khi code tới đúng chỗ đó (upload ảnh, Dockerfile production, CD).
- Chưa chốt có dùng Kubernetes hay không, nên chưa viết gì cho compute.
  - Khi chốt, cập nhật dòng mô tả `infra/` và `k8s/` trong `AGENTS.md` và `docs/brainstom.md`.

## Nguyên tắc

- Sau khi import, Terraform là nguồn sự thật của Cognito: không sửa tay trên console.
  - Lý do: sửa tay làm state lệch, lần `plan` sau sẽ đòi đảo ngược thay đổi đó.
- Mọi thay đổi `infra/` đi qua PR như code khác. `plan` được đọc kỹ trước khi `apply`.
- `apply` chạy tay ở máy, chưa chạy từ CI.
  - Lý do: chưa có OIDC cho GitHub Actions, và học `plan` bằng mắt trước khi tự động hoá.
- Secret không bao giờ vào repo. Repo là public.
- `AGENTS.md` yêu cầu hỏi trước khi đổi Terraform, nên mỗi thay đổi hạ tầng cần được duyệt rõ ràng.

## Chuẩn bị

- Terraform bản mới (từ 1.11 trở lên để dùng khoá state ngay trong S3).
- AWS CLI profile `lastbite-dev`, kiểm tra bằng `aws sts get-caller-identity --profile lastbite-dev`.
  - Dùng IAM user riêng có MFA, không dùng root.
- AWS Budget cảnh báo (ví dụ 10 USD) trước khi tạo bất kỳ resource nào.
- `.gitignore` thêm `*.tfstate*`, `.terraform/`, `*.tfvars`.
  - Lý do: state chứa secret, và state hay `tfvars` lộ lên repo public rất khó thu hồi.

## Cấu trúc thư mục

- `infra/cognito/`: một root module duy nhất, gồm `versions.tf`, `variables.tf`, `main.tf`, `outputs.tf`.
  - Lý do: mới có một nhóm resource, tách module hay môi trường khi có nhóm thứ hai.
- Khi thêm nhóm mới (ví dụ S3), tạo thư mục song song `infra/<tên>/` với state riêng.
  - Lý do: lỗi hay `destroy` ở nhóm này không lan sang nhóm khác.

## Resource

Mỗi resource thay cho một lệnh trong mục 4 của `docs/features/authentication.md`.

- User pool, thay cho `create-user-pool`:
  - Tier Essentials, đăng nhập bằng email, tự xác minh email, không phân biệt hoa thường.
  - Chỉ admin được tạo user, chưa mở đăng ký công khai.
  - Khôi phục tài khoản qua email đã xác minh.
  - Bật deletion protection.
- User pool domain, thay cho `create-user-pool-domain`: Hosted UI bản classic.
- Identity provider Google, thay cho `create-identity-provider`:
  - Scope `email profile openid`.
  - Ánh xạ thuộc tính: `email`, `email_verified`, `name`, `picture`.
- App client `lastbite-backend`, thay cho `create-user-pool-client`:
  - Có client secret, vì đây là confidential client của `lb-api`.
  - Authorization code flow, scope `openid email profile`, chỉ bật Google.
  - Callback là `/auth/callback` của API, logout là URL của hai frontend.
  - Access và ID token 1 giờ, refresh token 7 ngày, bật thu hồi token.
  - Bật `prevent user existence errors`.

## Biến và đầu ra

- Biến cần có: region, tên pool, tiền tố domain, ID Google client, URL callback và logout.
  - Secret của Google là biến `sensitive`, truyền bằng `TF_VAR_google_client_secret`, không ghi vào file.
- Đầu ra khớp 1:1 với biến môi trường của `lb-api`:
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_DOMAIN`, `COGNITO_CLIENT_SECRET` (đầu ra `sensitive`).
  - `COGNITO_REDIRECT_URI` và hai URL app lấy từ biến, không phải đầu ra.
  - Lý do: sau `apply`, điền thẳng vào `apps/lb-api/.env`, không phải tra ID thủ công như hiện nay.

## Secret và state

- State chứa client secret của Cognito và secret của Google.
  - Hệ quả: state không bao giờ được commit, và không để lỏng lẻo lâu.
- State của Cognito nằm trên S3 `lastbite-tfstate-ap-sa-v1` với key
  `cognito/terraform.tfstate`; bucket này được tạo bởi `infra/bootstrap/`.
- S3 backend dùng versioning, chặn public access và file lock (`use_lockfile`).
  - Bucket state phải tồn tại trước `terraform init` của Cognito (vấn đề con gà và quả trứng).

## Import pool đang chạy

User pool hiện tại (`ap-southeast-1_NTh5BNsuB`) được tạo bằng CLI. Đưa nó vào Terraform thay vì tạo mới.

- Lý do: không đổi ID nào trong `.env`, không gián đoạn đăng nhập, và học được `terraform import`.

Chạy trong `infra/cognito/`, với `$env:AWS_PROFILE = "lastbite-dev"` và các biến
`TF_VAR_google_client_id` / `TF_VAR_google_client_secret` đã đặt trong session hiện tại:

```powershell
terraform init
terraform import aws_cognito_user_pool.main ap-southeast-1_NTh5BNsuB
terraform import aws_cognito_user_pool_domain.main lastbite-auth-294787
terraform import aws_cognito_identity_provider.google ap-southeast-1_NTh5BNsuB:Google
terraform import aws_cognito_user_pool_client.backend ap-southeast-1_NTh5BNsuB/1b33vuogfdig1er3opcail7uba
terraform plan
```

Sau import, chỉnh code cho tới khi `plan` báo "No changes". Chỉ `apply` khi plan không còn
khác biệt mà bạn chưa hiểu.

Cẩn thận khi đọc `plan`:

- Dòng `must be replaced` hoặc `destroy` trên user pool là dấu hiệu phải dừng ngay.
  - Lý do: một số thuộc tính (như cách đăng nhập hay schema) buộc phải tạo lại pool nếu lệch, mất toàn bộ user.
  - Deletion protection chặn phần xoá, nhưng đừng dựa vào nó thay cho việc đọc `plan`.
- Với app client, lệch thuộc tính có thể làm đổi client secret, khiến `lb-api` ngừng chạy cho tới khi cập nhật `.env`.

## Thứ tự công việc

1. Chuẩn bị máy và tài khoản (mục Chuẩn bị).
2. Chạy `terraform init` trong `infra/cognito/` để dùng S3 backend.
3. Import, rồi `plan` cho tới khi sạch.
4. Điền đầu ra vào `.env`, chạy lại đăng nhập để kiểm chứng.
5. Sau đó mới tới các thứ trong "Chưa làm" theo tiến độ code, rồi CI chạy `fmt`, `validate`, `plan` trên PR.
