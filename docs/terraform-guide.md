# Hướng dẫn dùng Terraform cho LastBite

Thứ tự đọc: tạo IAM để có quyền chạy Terraform, cấu hình máy, chạy Terraform sau khi pull
code, rồi thêm, sửa, xoá resource.

Quyết định và lý do thiết kế xem `docs/terraform.md`. Mọi lệnh dùng PowerShell trên Windows.
Tên IAM user và tên profile AWS **do mỗi người tự chọn**; tài liệu này viết `<tên-profile>`
cho chỗ đó.

## 1. Bức tranh chung

- Hạ tầng nằm trong `infra/`, mỗi thư mục con là một **root module độc lập**:
  - `infra/bootstrap/`: bucket S3 chứa state. Đã chạy một lần, người khác không cần chạy.
  - `infra/cognito/`: User Pool, domain, Google IdP, app client. Đây là nơi làm việc hằng ngày.
- Chạy lệnh Terraform **trong thư mục của module**, không chạy ở thư mục gốc repo.
- **State** là file Terraform dùng để nhớ resource nào nó đang quản lý.
  - State của `cognito/` nằm trên S3: bucket `lastbite-tfstate-ap-sa-v1`, key `cognito/terraform.tfstate`.
  - Mọi người dùng chung một state, nên **không có file state trong repo**.
  - Có khoá (`use_lockfile`): hai người không `apply` cùng lúc được.
- Terraform là nguồn sự thật. Không sửa tay trên AWS console những thứ Terraform đang quản lý.

## 2. Khởi tạo IAM (làm trước tiên)

Terraform cần credential AWS mới chạy được, và credential này không do Terraform tạo ra.
Vì vậy IAM user dành cho Terraform là thứ **duy nhất tạo tay**.

### 2.1 Ai làm

- Người có quyền admin trên AWS account tạo user và cấp quyền.
  - Lý do: một IAM user không tự cấp quyền cho chính mình được.
- Mỗi người chạy Terraform nên có **IAM user riêng**, không dùng chung access key.
  - Lý do: lộ key hay nghỉ việc thì thu hồi đúng một người, và log CloudTrail biết ai làm gì.
- Không dùng root account để chạy Terraform.

### 2.2 Tạo IAM user

- Vào AWS Console → **IAM** → **Users** → **Create user**.
- Đặt tên tuỳ ý, ví dụ `terraform-<tên-bạn>`.
- Không bật quyền đăng nhập console nếu user chỉ để chạy Terraform.
- Ở bước **Set permissions**, chọn **Attach policies directly** và gắn:
  - Managed policy `AmazonCognitoPowerUser`.
- Tạo user xong, thêm policy cho state bucket:
  - Vào user → **Permissions** → **Add permissions** → **Create inline policy** → tab **JSON**.
  - Dán nội dung bên dưới, đặt tên `tfstate-bucket`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": [
        "arn:aws:s3:::lastbite-tfstate-*",
        "arn:aws:s3:::lastbite-tfstate-*/*"
      ]
    }
  ]
}
```

- Quyền này chỉ cho thao tác trên bucket tên bắt đầu bằng `lastbite-tfstate-`, không rộng hơn.

### 2.3 Tạo access key

- Vào user → **Security credentials** → **Create access key**.
- Chọn use case **Command Line Interface (CLI)**.
- Copy **Access key ID** và **Secret access key** ngay.
  - Secret chỉ hiện một lần. Mất thì phải tạo key mới.
  - Chỉ lưu ở password manager, không gửi qua chat, không commit.
- Nên bật **MFA** cho user nếu user cũng đăng nhập console.

### 2.4 Cấu hình máy của bạn

- Cài Terraform bản `>= 1.11` và AWS CLI v2.
  - Kiểm tra: `terraform version` và `aws --version`.
- Tạo profile với tên **bạn tự chọn**:
  - `aws configure --profile <tên-profile>`
  - Nhập Access key ID, Secret access key, region `ap-southeast-1`, output để trống.
- Kiểm tra credential dùng được:
  - `aws sts get-caller-identity --profile <tên-profile>`
  - Kết quả hiện đúng IAM user bạn vừa tạo là xong.
- Mỗi cửa sổ PowerShell mới, trước khi chạy Terraform:
  - `$env:AWS_PROFILE = "<tên-profile>"`
  - Code Terraform không ghi tên profile. Provider tự đọc `AWS_PROFILE` nên mỗi máy dùng profile riêng.

### 2.5 Khi cần thêm quyền

- Thêm loại resource mới (ví dụ S3 ảnh sản phẩm, ECR) thì IAM user cần quyền cho dịch vụ đó.
  - Thiếu quyền, `apply` báo `AccessDenied`.
  - Nhờ admin gắn thêm policy cho user (chỉ cấp đúng dịch vụ cần dùng).
- Thu hồi quyền: admin vào user → **Security credentials** → **Deactivate** rồi **Delete** access key.

## 3. Mỗi lần mở terminal mới

- Đặt profile: `$env:AWS_PROFILE = "<tên-profile>"`.
- Đặt biến Google OAuth cho phiên hiện tại (module `cognito` bắt buộc có, kể cả khi chỉ chạy `plan`):

```powershell
$env:TF_VAR_google_client_id = Read-Host "Google Client ID"
$secure = Read-Host "Google Client Secret" -AsSecureString
$env:TF_VAR_google_client_secret = [System.Net.NetworkCredential]::new("", $secure).Password
Remove-Variable secure
```

- Không tạo file `*.tfvars` chứa secret. Repo là public, và `*.tfvars` đã bị `.gitignore`.
- Biến môi trường chỉ sống trong cửa sổ terminal đó. Đóng terminal là mất, lần sau nhập lại.
  - Google secret lấy từ password manager hoặc Google Cloud Console (xem `docs/features/cognito-google-setup.md`).

## 4. Pull code về rồi chạy

Quy trình mỗi lần `git pull` có thay đổi trong `infra/`:

- Vào module: `cd infra/cognito`.
- Đặt `AWS_PROFILE` và biến Google (mục 3).
- `terraform init`
  - Chạy lần đầu, hoặc khi `versions.tf` đổi provider, version hay backend.
  - Không có thay đổi gì thì không cần chạy lại, nhưng chạy cũng không hại.
- `terraform plan`
  - Khi chưa ai đổi gì kết quả phải là: `No changes. Your infrastructure matches the configuration.`
  - Có thay đổi mà bạn không biết nguồn gốc: **dừng lại, không `apply`**, xem mục 11.
- Chỉ `apply` khi bạn có việc cần thay đổi, không `apply` chỉ vì pull code.
  - Người tạo PR đã `apply` rồi thì state trên S3 đã mới, `plan` của bạn sẽ sạch.
- Lấy giá trị cho `.env` của `lb-api`: `terraform output` (xem mục 8).

## 5. Quy trình chung cho mọi thay đổi hạ tầng

Thêm, sửa hay xoá resource đều đi cùng một vòng:

- Sửa code trong `infra/<module>/`.
- Chạy:

```powershell
terraform fmt        # chuẩn hoá format
terraform validate   # kiểm tra cú pháp và tham chiếu
terraform plan       # đọc kỹ trước khi apply
terraform apply      # gõ đúng "yes" để xác nhận
terraform plan       # phải ra "No changes"
```

- Lệnh `plan` cuối cùng để chắc chắn code và thực tế đã khớp.
- Sửa `infra/` đi qua PR, **đính kèm output `plan`** vào mô tả PR.
- Repo yêu cầu hỏi trước khi đổi Terraform (xem `AGENTS.md`), nên đừng `apply` khi chưa được duyệt.
- `apply` chạy tay trên máy, chưa chạy từ CI.

### Đọc plan

| Ký hiệu | Nghĩa | Mức độ |
| --- | --- | --- |
| `+` | Tạo mới | Bình thường |
| `~` | Sửa tại chỗ | Xem thuộc tính nào đổi |
| `-` | Xoá | Phải biết chắc vì sao |
| `-/+` | Xoá rồi tạo lại | **Nguy hiểm nhất**, dừng lại xem kỹ |

- Cuối plan có dòng `Plan: X to add, Y to change, Z to destroy.` Đọc dòng này trước.
- Dòng `must be replaced` trên User Pool nghĩa là mất toàn bộ user. Dừng ngay.
- Lệch thuộc tính của app client có thể làm đổi `client_secret`, khi đó `lb-api` ngừng chạy cho tới khi cập nhật `.env`.

## 6. Thêm resource mới

- Kiểm tra IAM user của bạn có quyền cho loại resource này chưa (mục 2.5).
- Viết block `resource` vào `infra/<module>/main.tf` (hoặc file mới cùng thư mục).
  - Thêm biến vào `variables.tf`, đầu ra vào `outputs.tf` nếu cần.
  - Resource mới trong cùng module thì **không cần `init` lại**.
  - Thêm provider mới thì cần `terraform init`.
- Chạy `fmt`, `validate`, `plan`. Plan chỉ nên có dòng `+` cho resource mới.
- `apply`, rồi `plan` lại để thấy `No changes`.
- Mở PR kèm output `plan`.

### Thêm một nhóm hạ tầng mới (ví dụ S3 ảnh sản phẩm)

- Tạo thư mục song song `infra/<tên>/` với `versions.tf`, `variables.tf`, `main.tf`, `outputs.tf` riêng.
- Backend S3 dùng chung bucket state nhưng **key riêng**, ví dụ `s3/terraform.tfstate`.
  - Lý do: lỗi hay `destroy` ở nhóm này không lan sang nhóm khác.
- Chạy `terraform init` trong thư mục mới.
- Cập nhật bảng cấu trúc trong `infra/README.md`.

### Đưa resource đã tạo tay vào Terraform (import)

Dùng khi resource đã tồn tại trên AWS, không muốn tạo lại.

- Viết block `resource` tương ứng trong code.
- Chạy `terraform import <địa chỉ resource> <ID trên AWS>`, ví dụ:
  - `terraform import aws_cognito_user_pool.main ap-southeast-1_NTh5BNsuB`
- Chạy `terraform plan` và chỉnh code cho tới khi ra `No changes`.
  - Chưa khớp thì **không `apply`**, vì `apply` sẽ ghi đè resource thật theo code.
- Các lệnh import đã dùng cho Cognito nằm ở `infra/README.md`.

## 7. Sửa resource

- Sửa giá trị trong code, hoặc biến (ví dụ `callback_url` khi lên domain thật).
- Chạy vòng ở mục 5. `plan` hiện dòng `~` cho thuộc tính đổi.
  - Đọc kỹ từng dòng `~`, đặc biệt trên app client và user pool.
- Truyền giá trị tạm không muốn sửa code: `terraform plan -var "callback_url=https://..."`.
  - Chỉ dùng để thử. Giá trị thật phải nằm trong code hoặc biến môi trường `TF_VAR_...`.
- Ép tạo lại một resource (ví dụ để đổi `client_secret`):
  - `terraform apply -replace="aws_cognito_user_pool_client.backend"`
  - Sau đó phải cập nhật `COGNITO_CLIENT_SECRET` trong `apps/lb-api/.env`.
- Đổi tên resource trong code (không đổi resource thật) thì Terraform hiểu là xoá cái cũ, tạo cái mới.
  - Dùng block `moved { from = ... to = ... }` hoặc `terraform state mv` để giữ resource.

## 8. Xem state và output

- Liệt kê resource Terraform đang quản lý: `terraform state list`
- Xem chi tiết một resource: `terraform state show aws_cognito_user_pool_client.backend`
  - Lưu ý: output này có thể in ra secret, đừng paste lên chat hay PR.
- Xem output: `terraform output`
  - Output `sensitive` hiển thị `<sensitive>`. Lấy giá trị thật:
  - `terraform output -raw COGNITO_CLIENT_SECRET`
- Đối chiếu output với biến của `lb-api` (tất cả ghi vào `apps/lb-api/.env`):
  - `COGNITO_USER_POOL_ID`, `COGNITO_CLIENT_ID`, `COGNITO_CLIENT_SECRET`, `COGNITO_DOMAIN`.
  - `COGNITO_REDIRECT_URI`, `APP_URL` lấy từ biến, không phải output.

## 9. Xoá resource

### Cách chuẩn: xoá khỏi code rồi apply

- Xoá block `resource` khỏi file `.tf`.
- Xoá luôn biến, output và tham chiếu tới resource đó, nếu không `validate` sẽ lỗi.
- `terraform plan`: phải thấy dòng `-` đúng resource định xoá, không có gì khác.
- `terraform apply`, rồi `plan` lại để thấy `No changes`.

### Các resource có `prevent_destroy`

- `aws_cognito_user_pool.main` (module `cognito`) và bucket state trong `bootstrap/` đều có
  `prevent_destroy = true`.
- Plan nào dẫn tới xoá hoặc tạo lại chúng sẽ **báo lỗi và dừng**:
  `Instance cannot be destroyed`.
- Đây là chủ đích. Muốn xoá thật thì phải được duyệt, sau đó mới bỏ `prevent_destroy` trong code.
  - Với User Pool còn phải tắt `deletion_protection` (đang bật `ACTIVE`).
  - Xoá User Pool là mất toàn bộ user và không khôi phục được.

### `terraform destroy`

- `terraform destroy` xoá **toàn bộ** resource của module. **Không chạy** trên module `cognito`.
  - Với cấu hình hiện tại lệnh này sẽ lỗi vì `prevent_destroy`, nhưng đừng dựa vào đó.
- Xoá riêng một resource bằng cờ `-target` chỉ dùng khi bất đắc dĩ:
  - `terraform plan -destroy -target="aws_cognito_identity_provider.google"`
  - Đọc kỹ plan, rồi `terraform destroy -target="aws_cognito_identity_provider.google"`.
  - Lý do hạn chế: `-target` bỏ qua phần còn lại, dễ làm code và state lệch nhau.
- Không bao giờ chạy `destroy` trong `infra/bootstrap/`.
  - Xoá bucket state là mất state của mọi module khác.

### Bỏ resource khỏi Terraform nhưng giữ trên AWS

- `terraform state rm aws_cognito_identity_provider.google`
  - Resource vẫn còn trên AWS, chỉ là Terraform không quản lý nữa.
  - Nhớ xoá block tương ứng trong code, nếu không lần `plan` sau Terraform sẽ đòi tạo lại.

## 10. Lệnh state nguy hiểm

- `terraform state rm`, `terraform import`, `terraform state mv` sửa trực tiếp state dùng chung.
  - Báo cho cả nhóm trước khi chạy, vì state là chung.
  - Bucket state có versioning nên có thể khôi phục bản cũ, nhưng nhờ admin làm.
- Không sửa tay file state.
- `terraform force-unlock <LOCK_ID>`: chỉ dùng khi chắc chắn không ai đang chạy `apply`.
  - Khi lệnh bị ngắt giữa chừng, lần sau có thể báo lỗi khoá (`Error acquiring the state lock`).
  - Hỏi nhóm xem có ai đang chạy không, rồi mới mở khoá.

## 11. Gặp thay đổi lạ trong plan

Plan hiện thay đổi mà bạn không sửa gì (drift). Làm theo thứ tự:

- Kiểm tra bạn đã pull code mới nhất (`git pull`) và đang ở đúng module.
- Kiểm tra biến môi trường: sai `TF_VAR_google_client_id` cũng tạo ra dòng `~` trên Identity Provider.
- Hỏi nhóm xem có ai sửa tay trên AWS console không.
- Quyết định, **không apply khi chưa hiểu**:
  - Muốn giữ code: `apply` để đưa AWS về đúng code.
  - Muốn giữ thay đổi trên AWS: sửa code cho khớp, rồi `plan` tới khi sạch.

## 12. Lỗi thường gặp

| Lỗi | Nguyên nhân | Cách sửa |
| --- | --- | --- |
| `No valid credential sources found` | Chưa đặt `AWS_PROFILE` trong cửa sổ này | `$env:AWS_PROFILE = "<tên-profile>"` |
| `SignatureDoesNotMatch` | Secret key sai hoặc thiếu | `aws configure --profile <tên-profile>` nhập lại key |
| `InvalidClientTokenId` | Access key sai hoặc đã bị vô hiệu | Tạo key mới (mục 2.3) |
| `AccessDenied` | IAM user thiếu quyền | Nhờ admin gắn policy (mục 2.5) |
| `No value for required variable` | Chưa đặt `TF_VAR_google_client_id` hoặc `..._secret` | Làm lại mục 3 |
| `Backend initialization required` | Chưa `init`, hoặc backend đổi | `terraform init` |
| `Error acquiring the state lock` | Có người đang `apply`, hoặc lần chạy trước bị ngắt | Chờ, hỏi nhóm; chắc chắn rồi mới `force-unlock` |
| `Instance cannot be destroyed` | Resource có `prevent_destroy` | Xem mục 9; đây là chủ đích |
| `Failed to query available provider packages` | Mạng hoặc lock file lệch | Kiểm tra mạng, chạy `terraform init -upgrade` rồi review diff `.terraform.lock.hcl` |

## 13. Quy tắc cần nhớ

- Mỗi người một IAM user và một access key riêng. Không chia sẻ key.
- Không commit: `*.tfstate*`, `*.tfvars`, `.terraform/`. Đã nằm trong `.gitignore`.
- **Có** commit `.terraform.lock.hcl` để cả nhóm dùng cùng version provider.
  - `terraform init -upgrade` sẽ đổi file này, chỉ chạy khi chủ ý nâng version.
- Không dán output của `terraform state show` hay `terraform output -raw` ở chỗ công khai.
- Không sửa tay trên console những thứ Terraform đang quản lý.
- Mọi thay đổi `infra/` đi qua PR, kèm output `plan`.
- `plan` luôn là bước đọc kỹ nhất, `apply` chỉ là bước xác nhận.
