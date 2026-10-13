# Infra

Hạ tầng AWS của LastBite, quản lý bằng Terraform.

## Cấu trúc

| Thư mục | Nội dung | State |
|---|---|---|
| `bootstrap/` | Bucket S3 chứa state cho các thư mục còn lại | Lưu ở máy người đã chạy |
| `cognito/` | Cognito user pool, domain, Google IdP, app client | (chưa làm) S3 |

Mỗi thư mục là một root module độc lập: `cd` vào rồi chạy lệnh trong đó.

## Chuẩn bị (mỗi người làm một lần)

1. Cài Terraform >= 1.11 và AWS CLI v2.
2. Xin admin cấp access key của IAM user `lastbite-terraform`.
3. Tạo profile:
   ```bash
   aws configure --profile lastbite-dev   # region: ap-southeast-1
   aws sts get-caller-identity --profile lastbite-dev
   ```
4. Mỗi terminal mới, trước khi chạy Terraform:
   ```bash
   export AWS_PROFILE=lastbite-dev
   ```

### Quyền của `lastbite-terraform`

IAM user và quyền của nó là thứ duy nhất tạo tay, vì Terraform cần credential mới chạy được.
Admin cấp trong CloudShell (user không tự cấp quyền cho chính mình được):

- Managed policy `AmazonCognitoPowerUser`.
- Inline policy `tfstate-bucket`: `s3:*` trên `arn:aws:s3:::lastbite-tfstate-*` và `arn:aws:s3:::lastbite-tfstate-*/*`.

## Vòng làm việc

```bash
terraform init       # lần đầu, hoặc khi đổi provider/module/backend
terraform fmt
terraform validate
terraform plan       # đọc kỹ trước khi apply
terraform apply      # gõ đúng "yes" để xác nhận
terraform plan       # phải ra "No changes"
```

Thêm resource không cần `init` lại.

### Đọc plan

| Ký hiệu | Nghĩa |
|---|---|
| `+` | Tạo mới |
| `~` | Sửa tại chỗ |
| `-` | Xoá |
| `-/+` | Xoá rồi tạo lại, nguy hiểm nhất, dừng lại xem kỹ |

## Bootstrap

Chạy **một lần cho cả dự án**, đã chạy rồi. Bucket hiện tại: `lastbite-tfstate-ap-sa-v1`.

- Bucket bật versioning và chặn public, có `prevent_destroy`.
- State của `bootstrap/` đang nằm ở máy người đã apply. Không xoá file `terraform.tfstate` trong thư mục này.
- Người khác không cần chạy `bootstrap/`, chỉ cần dùng bucket làm backend.

## Quy tắc

- Resource do Terraform quản lý thì không sửa tay trên console, sửa trong code rồi `apply`.
- Không commit `*.tfstate*`, `*.tfvars`, `.terraform/`, đã có trong `.gitignore`.
  `.terraform.lock.hcl` thì commit.
- Mọi thay đổi `infra/` đi qua PR, kèm output `plan`.

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `No valid credential sources found` | Chưa `export AWS_PROFILE` trong terminal này | `export AWS_PROFILE=lastbite-dev` |
| `SignatureDoesNotMatch` | Secret key sai hoặc thiếu | Nhập lại: `aws configure set aws_secret_access_key '<SECRET>' --profile lastbite-dev` |
| `AccessDenied` khi `apply` | User thiếu quyền cho resource đó | Nhờ admin cấp quyền trong CloudShell |
