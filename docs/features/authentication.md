# Xác thực Google OAuth với Cognito

## 1. Mục tiêu

- Chỉ hỗ trợ Google OAuth trong MVP.
- Cognito quản lý kết nối với Google.
- `lb-api` sở hữu OAuth callback và Cognito token.
- Frontend chỉ nhận cookie phiên `lb_session`.
- Một tài khoản dùng được cả customer và merchant.
- Quyền merchant dựa trên quyền sở hữu tài nguyên.

Không nằm trong MVP:

- Email/password.
- Magic link.
- MFA UI.
- Lưu Cognito token ở frontend.
- Tách tài khoản customer và merchant.

## 2. Cấu hình hiện tại

- AWS region: `ap-southeast-1`.
- User Pool: `lastbite-users`.
- User Pool ID: `ap-southeast-1_NTh5BNsuB`.
- Feature plan: `ESSENTIALS`.
- Deletion protection: `ACTIVE`.
- Cognito domain:
  `lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com`.
- Identity provider: `Google`.
- App client: `lastbite-backend`.
- App client ID: `1b33vuogfdig1er3opcail7uba`.
- OAuth grant: Authorization Code Grant.
- OAuth scopes: `openid email profile`.
- Access token: 1 giờ.
- ID token: 1 giờ.
- Refresh token: 7 ngày.
- Token revocation: bật.

URL đã đăng ký:

- Backend callback: `http://localhost:3000/auth/callback`.
- Customer logout: `http://localhost:5173`.
- Merchant logout: `http://localhost:5174`.
- Google redirect về Cognito:
  `https://lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com/oauth2/idpresponse`.

Google không redirect trực tiếp về `lb-api`. Google luôn redirect về Cognito qua
`/oauth2/idpresponse`; sau đó Cognito mới redirect về backend callback.

## 3. Quản lý secret

Các giá trị bí mật:

- Google OAuth Client Secret.
- Cognito app client secret.
- Cognito refresh token.
- Khóa hoặc pepper dùng cho LastBite session.

Quy tắc:

- Không commit secret vào repository.
- Không dùng prefix `NUXT_PUBLIC_` hoặc `VITE_` cho secret.
- Không gửi Cognito token về frontend.
- Không ghi code, token, cookie hoặc secret vào log.
- Local dùng file env đã được Git ignore hoặc secret store cục bộ.
- Môi trường deploy dùng managed secret store.
- Secret bị lộ phải rotate ngay.

Biến môi trường dự kiến cho `lb-api`:

```dotenv
AWS_REGION=ap-southeast-1
COGNITO_USER_POOL_ID=ap-southeast-1_NTh5BNsuB
COGNITO_CLIENT_ID=1b33vuogfdig1er3opcail7uba
COGNITO_CLIENT_SECRET=<backend-only-secret>
COGNITO_DOMAIN=https://lastbite-auth-294787.auth.ap-southeast-1.amazoncognito.com
COGNITO_REDIRECT_URI=http://localhost:3000/auth/callback
AUTH_COOKIE_NAME=lb_session
CUSTOMER_APP_URL=http://localhost:5173
MERCHANT_APP_URL=http://localhost:5174
```

## 4. Cài đặt Cognito

Các lệnh dưới đây dùng PowerShell và AWS CLI v2.

### 4.1 Tạo User Pool

```powershell
aws cognito-idp create-user-pool `
  --pool-name lastbite-users `
  --user-pool-tier ESSENTIALS `
  --username-attributes email `
  --auto-verified-attributes email `
  --username-configuration "CaseSensitive=false" `
  --admin-create-user-config "AllowAdminCreateUserOnly=true" `
  --account-recovery-setting "RecoveryMechanisms=[{Priority=1,Name=verified_email}]" `
  --deletion-protection ACTIVE `
  --region ap-southeast-1
```

Ý nghĩa chính:

- Dùng Cognito Essentials.
- Email không phân biệt chữ hoa/thường.
- Không mở đăng ký local công khai.
- Bật bảo vệ xóa nhầm.

### 4.2 Tạo Cognito domain

```powershell
aws cognito-idp create-user-pool-domain `
  --user-pool-id <user-pool-id> `
  --domain <unique-domain-prefix> `
  --managed-login-version 1 `
  --region ap-southeast-1
```

- Domain prefix phải duy nhất.
- LastBite đang dùng Hosted UI classic.
- Không cần xây trang đăng nhập riêng trong Cognito.

### 4.3 Tạo Google OAuth client

Trong Google Auth Platform:

- Chọn loại ứng dụng `Web application`.
- Audience là `External`.
- Giữ trạng thái `Testing` khi phát triển.
- Thêm tài khoản phát triển vào `Test users`.
- Authorized JavaScript origin là Cognito domain origin.
- Authorized redirect URI là Cognito domain cộng
  `/oauth2/idpresponse`.
- Dùng scopes `openid`, `email`, `profile`.
- Lưu Client Secret ở nơi an toàn.

### 4.4 Đăng ký Google IdP trong Cognito

Dùng file JSON tạm để tránh PowerShell làm hỏng dấu ngoặc kép:

```powershell
$GoogleClientId = (Read-Host "Google Client ID").Trim()
$SecretSecure = Read-Host "Google Client Secret" -AsSecureString
$GoogleClientSecret = [System.Net.NetworkCredential]::new("", $SecretSecure).Password
$ProviderFile = [System.IO.Path]::GetTempFileName()

@{
  client_id = $GoogleClientId
  client_secret = $GoogleClientSecret
  authorize_scopes = "email profile openid"
} | ConvertTo-Json -Compress | Set-Content -LiteralPath $ProviderFile -Encoding ascii

aws cognito-idp create-identity-provider `
  --user-pool-id <user-pool-id> `
  --provider-name Google `
  --provider-type Google `
  --provider-details "file://$ProviderFile" `
  --attribute-mapping "email=email,email_verified=email_verified,name=name,picture=picture" `
  --region ap-southeast-1

Remove-Item -LiteralPath $ProviderFile -Force
Remove-Variable GoogleClientSecret,SecretSecure,ProviderFile -ErrorAction SilentlyContinue
```

Attribute mapping:

- `email` <- Google `email`.
- `email_verified` <- Google `email_verified`.
- `name` <- Google `name`.
- `picture` <- Google `picture`.
- Cognito tự ánh xạ `username` từ Google `sub`.
- Backend dùng Cognito `sub` làm định danh ngoài ổn định.
- Không dùng email làm khóa định danh người dùng.

### 4.5 Tạo backend app client

```powershell
aws cognito-idp create-user-pool-client `
  --user-pool-id <user-pool-id> `
  --client-name lastbite-backend `
  --generate-secret `
  --refresh-token-validity 7 `
  --access-token-validity 1 `
  --id-token-validity 1 `
  --token-validity-units "AccessToken=hours,IdToken=hours,RefreshToken=days" `
  --explicit-auth-flows ALLOW_REFRESH_TOKEN_AUTH `
  --supported-identity-providers Google `
  --callback-urls "http://localhost:3000/auth/callback" `
  --logout-urls "http://localhost:5173" "http://localhost:5174" `
  --default-redirect-uri "http://localhost:3000/auth/callback" `
  --allowed-o-auth-flows code `
  --allowed-o-auth-scopes openid email profile `
  --allowed-o-auth-flows-user-pool-client `
  --prevent-user-existence-errors ENABLED `
  --enable-token-revocation `
  --region ap-southeast-1
```

Lưu ý:

- Đây là confidential client dành cho `lb-api`.
- Không đưa app client secret vào customer hoặc merchant app.
- Không dùng implicit flow.
- Không chia sẻ output đầy đủ của lệnh tạo client vì có thể chứa secret.

## 5. Contract kỹ thuật của backend

### `GET /auth/login`

- Nhận tùy chọn `returnTo`.
- Chỉ chấp nhận origin customer và merchant đã cho phép.
- Tạo `state` ngẫu nhiên.
- Tạo `nonce` ngẫu nhiên.
- Lưu OAuth transaction ngắn hạn trong Redis.
- Chỉ lưu digest của `state` nếu có thể.
- Lưu `nonce`, `returnTo`, thời điểm tạo và thời gian hết hạn.
- Redirect trình duyệt đến Cognito `/oauth2/authorize`.

Authorize request phải có:

- `response_type=code`.
- `client_id` của `lastbite-backend`.
- `redirect_uri=http://localhost:3000/auth/callback`.
- `scope=openid email profile`.
- `identity_provider=Google`.
- `state` và `nonce`.

Frontend chỉ điều hướng trình duyệt đến `/auth/login`. Frontend không:

- Gọi trực tiếp Google API.
- Tự tạo authorize URL.
- Exchange authorization code.
- Giữ Cognito token.

### `GET /auth/callback`

- Bắt buộc có `code` và `state`.
- Tìm OAuth transaction tương ứng.
- Chỉ cho phép dùng transaction một lần.
- Từ chối state thiếu, sai, hết hạn hoặc đã dùng.
- Exchange code tại Cognito `/oauth2/token`.
- Xác thực token request bằng app client ID và secret.
- Dùng đúng callback URI đã đăng ký.
- Kiểm tra token trước khi đọc claim.
- Tạo hoặc cập nhật LastBite user.
- Tạo LastBite session riêng.
- Set cookie `lb_session`.
- Chỉ redirect về customer hoặc merchant URL đã cho phép.

Token request:

- Method: `POST`.
- Content type: `application/x-www-form-urlencoded`.
- Grant type: `authorization_code`.
- Chạy server-to-server từ `lb-api`.

### GraphQL request đã đăng nhập

- Frontend gửi cookie bằng `credentials: include`.
- Frontend không gửi Cognito Bearer token.
- Auth guard đọc cookie `lb_session`.
- Auth guard hash token phiên.
- Tìm session trong Redis trước.
- Fallback sang Postgres khi cache miss.
- Từ chối session hết hạn hoặc đã revoke.
- Gắn internal user ID vào request context.

Authentication không quyết định quyền merchant. Resolver/service vẫn phải:

- Kiểm tra store thuộc user hiện tại.
- Kiểm tra resource thuộc đúng store.
- Không tin merchant ID hoặc role do frontend gửi lên.

### Logout

- Revoke Cognito refresh token nếu backend đang lưu token này.
- Đánh dấu LastBite session đã revoke trong Postgres.
- Xóa Redis session cache.
- Xóa cookie bằng đúng path/domain cũ.
- Chỉ redirect về URL logout đã đăng ký.
- Luôn hủy local session dù Cognito logout thất bại.

## 6. Kiểm tra Cognito token

Giá trị cố định:

```text
Issuer: https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_NTh5BNsuB
JWKS:   https://cognito-idp.ap-southeast-1.amazonaws.com/ap-southeast-1_NTh5BNsuB/.well-known/jwks.json
```

Backend phải:

- Kiểm tra chữ ký JWT bằng JWKS.
- Chỉ cho phép thuật toán ký mong đợi.
- Kiểm tra đúng issuer.
- Kiểm tra audience hoặc client ID theo loại token.
- Kiểm tra `exp`, `iat` và `token_use`.
- So sánh nonce trong ID token với OAuth transaction.
- Bắt buộc có Cognito `sub`.
- Không dùng email làm principal ID.
- Không đọc quyền sở hữu từ frontend claim.

JWKS cache:

- Cache theo key ID.
- Có TTL giới hạn.
- Khi thiếu key ID, refresh đúng một lần.
- Sau một lần refresh vẫn thiếu thì từ chối token.

## 7. LastBite session

Khi token Cognito hợp lệ:

- Tạo ít nhất 32 byte ngẫu nhiên.
- Encode thành opaque session token.
- Chỉ gửi raw token trong cookie `lb_session`.
- Chỉ lưu digest trong Postgres và Redis.
- Postgres là nguồn dữ liệu chính.
- Redis chỉ dùng cho lookup/cache và TTL.
- Refresh token Cognito phải được mã hóa khi lưu lâu dài.
- Không lưu refresh token plaintext trong Redis.

Cookie đề xuất:

```text
HttpOnly
SameSite=Lax
Path=/
Secure=true khi chạy HTTPS
Secure=false chỉ cho local HTTP
```

Lưu ý bảo mật:

- Không đặt cookie `Domain` rộng trên localhost.
- CORS chỉ cho phép customer và merchant origin.
- Bật credential cho đúng origin, không dùng wildcard.
- Kiểm tra `Origin` cho request thay đổi dữ liệu.
- Không chỉ dựa vào `SameSite` để chống CSRF.
- Chặn content type không được hỗ trợ.
- Thêm CSRF token nếu topology deploy làm yếu same-site protection.

## 8. Đồng bộ người dùng

Lần đăng nhập đầu:

- Tìm user bằng Cognito `sub`.
- Chưa có thì tạo LastBite user tối thiểu.
- Lưu email đã chuẩn hóa.
- Lưu `email_verified`.
- Lưu tên và ảnh làm dữ liệu hồ sơ.

Các lần sau:

- Tiếp tục tìm bằng Cognito `sub`.
- Chỉ cập nhật các profile field được phép thay đổi.
- Không tạo user mới theo app customer/merchant.
- Không tự động merge tài khoản chỉ dựa vào email.

Quyền ứng dụng:

- Không lấy từ Cognito group trong MVP.
- Không tách role cố định customer/merchant.
- Dựa vào dữ liệu và quyền sở hữu trong LastBite.

## 9. Kiểm chứng cấu hình

Lệnh kiểm tra không in secret:

```powershell
aws cognito-idp describe-user-pool-client `
  --user-pool-id ap-southeast-1_NTh5BNsuB `
  --client-id 1b33vuogfdig1er3opcail7uba `
  --region ap-southeast-1 `
  --query "UserPoolClient.{Providers:SupportedIdentityProviders,Callbacks:CallbackURLs,Logouts:LogoutURLs,Flows:AllowedOAuthFlows,Scopes:AllowedOAuthScopes,OAuthEnabled:AllowedOAuthFlowsUserPoolClient,AccessValidity:AccessTokenValidity,IdValidity:IdTokenValidity,RefreshValidity:RefreshTokenValidity,Units:TokenValidityUnits,Revocation:EnableTokenRevocation}"
```

Đã kiểm chứng ngày 2026-09-21:

- Google chấp nhận OAuth client.
- Cognito chấp nhận authorization response từ Google.
- Cognito redirect về `/auth/callback` với `code` và `state`.
- App client chỉ bật Google và authorization code flow.
- Access/ID token có thời hạn 1 giờ.
- Refresh token có thời hạn 7 ngày.

Chưa được kiểm chứng:

- Backend exchange authorization code.
- Kiểm tra JWT trong `lb-api`.
- Tạo user lần đầu.
- Lưu session vào Postgres/Redis.
- Cookie authentication cho GraphQL.
- Refresh và logout thực tế.

Redirect thành công từ Cognito chưa chứng minh các phần backend trên đã tồn tại.

## 10. Tài liệu chính thức

- [Cognito social identity providers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-social-idp.html)
- [Cognito app client CLI](https://docs.aws.amazon.com/cli/latest/reference/cognito-idp/create-user-pool-client.html)
- [Cognito authorization endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/authorization-endpoint.html)
- [Cognito token endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/token-endpoint.html)
- [Cognito logout endpoint](https://docs.aws.amazon.com/cognito/latest/developerguide/logout-endpoint.html)
- [Google OAuth client và secret rotation](https://support.google.com/cloud/answer/15549257)
