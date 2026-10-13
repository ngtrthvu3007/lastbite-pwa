# Infra

Hạ tầng AWS của LastBite, quản lý bằng Terraform.

## Cấu trúc

| Thư mục | Nội dung | State |
|---|---|---|
| `bootstrap/` | Bucket S3 chứa state cho các thư mục còn lại | Lưu ở máy người đã chạy |
| `cognito/` | Cognito user pool, domain, Google IdP, app client | S3 |

Mỗi thư mục là một root module độc lập: `cd` vào rồi chạy lệnh trong đó.

## Chuẩn bị (mỗi người làm một lần)

1. Cài Terraform >= 1.11 và AWS CLI v2.
2. Xin admin cấp access key của IAM user `lastbite-terraform`.
3. Tạo profile:
   ```bash
   aws configure --profile lastbite-dev   # region: ap-southeast-1
   aws sts get-caller-identity --profile lastbite-dev
   ```
4. Mỗi PowerShell mới, trước khi chạy Terraform:
   ```bash
   $env:AWS_PROFILE = "lastbite-dev"
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

## Cognito

`cognito/` quản lý User Pool đã tồn tại, không tạo pool mới. Trước khi import,
đặt Google OAuth values trong session hiện tại, không tạo `tfvars`:

```powershell
$env:TF_VAR_google_client_id = Read-Host "Google Client ID"
$GoogleClientSecret = Read-Host "Google Client Secret" -AsSecureString
$env:TF_VAR_google_client_secret = [System.Net.NetworkCredential]::new("", $GoogleClientSecret).Password
```

Sau đó, trong `infra/cognito/`, chạy lần lượt:

```powershell
terraform init
terraform import aws_cognito_user_pool.main ap-southeast-1_NTh5BNsuB
terraform import aws_cognito_user_pool_domain.main lastbite-auth-294787
terraform import aws_cognito_identity_provider.google ap-southeast-1_NTh5BNsuB:Google
terraform import aws_cognito_user_pool_client.backend ap-southeast-1_NTh5BNsuB/1b33vuogfdig1er3opcail7uba
terraform plan
```

Chỉ `apply` sau khi `terraform plan` không có thay đổi ngoài dự kiến.

## Quy tắc

- Resource do Terraform quản lý thì không sửa tay trên console, sửa trong code rồi `apply`.
- Không commit `*.tfstate*`, `*.tfvars`, `.terraform/`, đã có trong `.gitignore`.
  `.terraform.lock.hcl` thì commit.
- Mọi thay đổi `infra/` đi qua PR, kèm output `plan`.

## Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
|---|---|---|
| `No valid credential sources found` | Chưa đặt `AWS_PROFILE` trong PowerShell này | `$env:AWS_PROFILE = "lastbite-dev"` |
| `SignatureDoesNotMatch` | Secret key sai hoặc thiếu | Nhập lại: `aws configure set aws_secret_access_key '<SECRET>' --profile lastbite-dev` |
| `AccessDenied` khi `apply` | User thiếu quyền cho resource đó | Nhờ admin cấp quyền trong CloudShell |
