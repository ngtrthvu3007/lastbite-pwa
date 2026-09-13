# LastBite

Nền tảng kết nối tiểu thương/hộ kinh doanh nhỏ có đồ ăn dư thừa với người mua gần đó, giá giảm dần theo thời gian trước khi hết hạn/đóng cửa. Lấy cảm hứng từ Too Good To Go, nhưng theo hướng **minh bạch** (ảnh thật, không "túi bí mật") và nhắm đúng đối tượng tiểu thương VN (không phải nhà hàng/chuỗi lớn).

Mục tiêu dự án: học tech stack (Nuxt, Vue, NestJS, Golang, gRPC, RabbitMQ, Redis, AWS) qua 1 bài toán concurrency thật (chống giữ trùng hàng khi số lượng giới hạn), dùng làm CV/portfolio.

---

## 1. Vấn đề giải quyết

- Tiểu thương có đồ ăn dư cuối ngày, không có kênh nào để bán nhanh trước khi hỏng/phải bỏ
- Người mua muốn tìm đồ ăn giá rẻ gần mình, nhưng deal có tính thời hạn + số lượng giới hạn → dễ xảy ra tranh mua
- Core kỹ thuật: **atomic reservation** (chống 2 người cùng giữ 1 phần cuối) + **giá giảm dần theo thời gian còn lại**

---

## 2. Đối tượng người dùng

- **Merchant**: tiểu thương, hộ kinh doanh tại nhà, quán ăn nhỏ — không phải nhà hàng/chuỗi. Không quen dùng dashboard phức tạp, đăng bài theo cảm hứng/nguyên liệu có sẵn, không có menu cố định.
- **Customer**: người tìm đồ ăn giá rẻ gần vị trí mình, dùng chủ yếu trên mobile.
- 1 tài khoản có thể vừa là customer vừa là merchant (không tách 2 loại tài khoản riêng).

---

## 3. Tính năng

### Auth

- Google OAuth only (MVP không hỗ trợ email/password, không magic link)
- Đăng ký cửa hàng → tự động có quyền merchant gắn với cửa hàng đó, không cần duyệt/KYC
- RBAC dựa trên ownership (merchant chỉ sửa được resource của cửa hàng mình), không chỉ check role

### Hồ sơ Merchant

- Số điện thoại + địa chỉ mặc định (tùy chọn, khuyến khích cập nhật lúc đăng ký)
- Auto-fill vào form đăng bài nếu đã có hồ sơ, nhưng vẫn sửa được
- Mỗi bài đăng lưu giá trị độc lập, không tham chiếu ngược về hồ sơ (đổi hồ sơ sau này không ảnh hưởng bài cũ)

### Phía Merchant

- Đăng bài nhanh — không có khái niệm template, mỗi lần đăng là 1 **Post** độc lập:
  - Ảnh thật, giá, mô tả, số điện thoại, địa chỉ, số lượng, giờ lấy/giờ hết hạn
- Danh sách bài đã đăng, số lượng đã giữ chỗ/đã lấy trên mỗi bài
- Đếm tổng sản phẩm đã bán
- Xem chi tiết 1 đơn (ai giữ chỗ, lúc nào)
- Hủy/đóng sớm 1 bài nếu cần
- UI tối giản, ít bước, ít chữ — không phải dashboard SaaS phức tạp

### Phía Customer

- Danh sách bài đăng, sort theo khoảng cách (gần tôi trước)
- Bản đồ (Leaflet + OpenStreetMap) hiển thị vị trí
- Search theo tên/loại thực phẩm, filter giá/khung giờ (Postgres full-text search)
- Xem chi tiết: ảnh thật, mô tả, số lượng còn lại, giá hiện tại (giảm dần theo thời gian)
- Đặt giữ chỗ (atomic reservation), đếm ngược giờ phải đến lấy
- Xem real-time số lượng/giá thay đổi khi người khác vừa đặt
- Lịch sử đơn đã đặt

### Thanh toán

- **Không hỗ trợ** — người mua/bán tự thanh toán trực tiếp (tiền mặt/chuyển khoản khi lấy hàng)
- Tránh vấn đề pháp lý trung gian thanh toán, phù hợp nền tảng free

### Thông báo

- RabbitMQ + Web Push (PWA) — customer nhận nhắc giờ lấy, merchant nhận báo có đơn mới
- Zalo OA: cân nhắc sau (ngoài MVP), phù hợp thói quen tiểu thương VN hơn Web Push

### Ảnh sản phẩm

- Merchant upload ảnh thật khi đăng bài — dùng **presigned URL**: NestJS cấp URL ký sẵn, client upload thẳng lên S3 (không qua server), tránh tốn băng thông/CPU NestJS cho file nhị phân
- Sau khi upload xong, NestJS publish message vào RabbitMQ → **Go image worker** (service riêng) resize/optimize, tạo thumbnail, ghi lại URL ảnh đã xử lý

### RabbitMQ — các use case cụ thể (không chỉ để gửi noti)

- **Auto-release khi hết TTL giữ chỗ**: khi giữ chỗ, publish message có TTL = thời gian giữ chỗ vào 1 queue riêng (không ai consume trực tiếp) → hết TTL, message dead-letter sang queue khác → trigger nhả tồn kho + báo broadcast service. Dùng TTL + Dead Letter Exchange (DLX) của RabbitMQ, chủ động phát hiện hết hạn thay vì chờ request tình cờ tới mới check
- **Xử lý ảnh bất đồng bộ**: publish message sau khi merchant upload ảnh → worker riêng resize/optimize, tạo thumbnail, đẩy lên S3 — tách khỏi luồng đăng bài chính
- **Thông báo** (đã nêu trên): xác nhận đặt chỗ, nhắc giờ lấy, báo đơn mới cho merchant

### Hệ thống/background

- Go reservation engine: atomic lock chống giữ trùng phần cuối
- Auto-release khi hết TTL không đến lấy
- Tính giá động theo thời gian còn lại
- Go broadcast service: real-time WebSocket khi số lượng/giá đổi

---

## 4. Ngoài phạm vi MVP

- Thanh toán (thật hoặc giả lập đặt cọc)
- Review/rating, chat giữa khách và cửa hàng
- Khuyến mãi/mã giảm giá, loyalty
- Merchant KYC/duyệt tài khoản
- Elasticsearch (stretch goal sau khi core ổn — dataset nhỏ, Postgres full-text đủ dùng)
- Zalo OA integration
- Magic link login

---

## 5. Tech stack & lý do

| Thành phần | Vai trò | Vì sao cần |
| --- | --- | --- |
| Nuxt (SSR, PWA) | `apps/lb-customer` — customer app | SEO cho deal/cửa hàng, PWA cho trải nghiệm mobile-first, push notification |
| Vue (SPA, PWA) | `apps/lb-merchant` — merchant app | Không cần SEO, PWA để tiện dùng tại quầy, push báo đơn mới |
| NestJS (GraphQL) | `apps/lb-api` — API chính | CRUD cửa hàng/bài đăng/user, query linh hoạt qua GraphQL |
| Go — reservation engine | `apps/lb-reservation-engine` — atomic giữ chỗ | Bài toán concurrency thật — chống race condition khi nhiều người tranh 1 phần cuối |
| Go — broadcast service | `apps/lb-broadcast-service` — real-time WebSocket | Đẩy cập nhật số lượng/giá cho nhiều client cùng lúc |
| Go — image worker | `apps/image-worker` — xử lý ảnh async | Resize/optimize/thumbnail sau khi merchant upload lên S3, consume từ RabbitMQ |
| gRPC | Giao tiếp NestJS ↔ Go | Nội bộ, latency thấp |
| RabbitMQ | Event + task queue | Auto-release khi hết TTL (TTL + DLX), xử lý ảnh bất đồng bộ, gửi thông báo async |
| Redis | Lock TTL + cache | Giữ chỗ có thời hạn, cache danh sách deal đang active |
| Postgres | Dữ liệu chính | User, store, post, order, full-text search |
| S3 | Lưu ảnh sản phẩm | Ảnh merchant đăng, resize/optimize qua worker bất đồng bộ |
| Leaflet + OpenStreetMap | Bản đồ | Miễn phí, không cần API key, đủ cho quy mô demo |

---

## 6. Kiến trúc & triển khai

**Cấu trúc monorepo:**

```
lastbite/
├── apps/                       (code tự viết)
│   ├── lb-customer/             (Nuxt SSR, PWA — customer)
│   ├── lb-merchant/             (Vue SPA, PWA — merchant app)
│   ├── lb-api/                  (NestJS GraphQL)
│   ├── lb-reservation-engine/   (Go)
│   ├── lb-broadcast-service/    (Go)
│   └── image-worker/            (Go)
├── proto/                      (gRPC definitions dùng chung)
├── k8s/                        (manifest hạ tầng + app)
│   ├── rabbitmq/                (StatefulSet, cấu hình exchange/queue)
│   ├── postgres/                (StatefulSet)
│   ├── redis/                   (StatefulSet)
│   └── apps/                    (Deployment/Service/Ingress cho từng app ở trên)
└── infra/                      (Terraform — VPC, EC2, security group...)
```

RabbitMQ/Postgres/Redis không nằm trong `apps/` vì đó là service hạ tầng chạy sẵn (broker/database) — mình chỉ cấu hình (queue, exchange, schema) chứ không viết code logic bên trong chúng, khác với `apps/` là nơi chứa code tự viết.

**Deploy: Terraform + AWS + self-managed Kubernetes (kubeadm)**

Chọn self-managed thay vì EKS để hiểu sâu cách cluster vận hành (control plane, node join, scheduler), không chỉ dừng ở việc viết manifest.

- **Terraform** provision: VPC (public/private subnet), 3 EC2 (1 control plane + 2 worker), security group (mở port 6443 nội bộ + port app), IAM role
- **kubeadm init** trên control plane, **kubeadm join** trên 2 worker
- **CNI**: Flannel hoặc Calico (Calico nếu muốn học thêm NetworkPolicy)
- 3 node (không phải 1) để thấy rõ hiệu ứng scheduler rải pod qua nhiều máy khác nhau và self-healing khi 1 worker chết — 1 node duy nhất về bản chất chỉ tương đương PM2 cluster mode (nhiều process, vẫn 1 máy), không thể hiện được đặc trưng phân tán của k8s
- Deployment cho Nuxt customer app, Vue merchant app, NestJS, Go services/workers với `replicas ≥ 2` khi phù hợp
- StatefulSet cho Postgres, Redis, RabbitMQ (dùng `nodeAffinity` ghim vào 1 worker cố định để tránh vấn đề volume khi chưa dùng network storage)
- Ingress Controller (Nginx Ingress) route path/domain vào các service
- Chỉ bật EC2 khi cần demo, tắt lúc khác để tiết kiệm chi phí (self-managed dùng EC2 thường, tính theo giờ, không có phí control plane cố định như EKS)

**Core flow (giữ chỗ):**

1. Customer bấm giữ chỗ → NestJS → gRPC → Go reservation engine
2. Go dùng Redis atomic lock + TTL để giữ chỗ, tránh 2 request cùng lấy phần cuối
3. Thành công → publish RabbitMQ → broadcast service đẩy update real-time, notification worker gửi xác nhận
4. Hết TTL không đến lấy → tự động nhả lại, broadcast update lại số lượng

---

## 7. Câu hỏi/quyết định đã chốt

- 1 tài khoản = vừa customer vừa merchant, không tách riêng
- Không dùng Kafka (RabbitMQ đủ, tránh over-engineer khi chưa có nhu cầu replay/analytics)
- Không dùng Elasticsearch ở MVP (dataset nhỏ, Postgres full-text đủ) — để dành làm stretch goal
- Không có Bag Template — mỗi bài đăng độc lập, đúng thói quen tiểu thương (đăng theo cảm hứng, không menu cố định)
- Không hỗ trợ thanh toán dưới mọi hình thức
- Auth chỉ Google OAuth ở MVP
- Triển khai: Terraform + AWS, tự dựng Kubernetes bằng kubeadm (không dùng EKS) để học sâu cluster, không chỉ dừng ở viết manifest
- 3 EC2 (1 control plane + 2 worker) — đủ để thấy scheduler rải pod qua nhiều máy và self-healing, không dùng 1 node vì không thể hiện được đặc trưng phân tán của k8s

## Tài liệu

- Kiến trúc: <https://app.diagrams.net/?pv=0&grid=0#G1Zx1aTjHpcdGZmTgV3O90N2lAuhtMm8uG#%7B%22pageId%22%3A%22iCkposM1eEWwNhQuwuko%22%7D>
