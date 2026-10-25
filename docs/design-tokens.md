# LastBite Design Tokens

Tài liệu này định nghĩa bộ design token nền tảng cho LastBite trước khi đi vào thiết kế Figma.

Hướng branding đã chọn: **Leaf Green Primary, Golden Accent**.

- Xanh lá là màu nhận diện chính: tươi, sạch, đáng tin, gắn với giảm lãng phí thực phẩm.
- Vàng là màu nhấn: ấm, ngon miệng, hợp với deal/time-limited/cảnh báo nhẹ.
- Tomato/coral chỉ dùng cho trạng thái khẩn cấp hoặc lỗi, không dùng làm màu brand chính.
- Tránh neon, tránh màu xỉn/thâm, tránh palette quá tối hoặc quá nâu.

## 1. Brand Direction

LastBite nên tạo cảm giác:

- Tươi và sạch, không công nghiệp.
- Gần gũi với tiểu thương Việt Nam, không quá SaaS/dashboard.
- Đủ hiện đại để dùng cho portfolio technical project.
- Mobile-first, rõ CTA, dễ scan ảnh món ăn, giá và số lượng còn lại.

Từ khóa thị giác:

- Fresh market
- Warm food deal
- Honest local merchant
- Clean mobile marketplace
- Time-limited but not aggressive

## 2. Color Tokens

### 2.1 Brand

| Token | Hex | Vai trò |
| --- | --- | --- |
| `color.brand.primary` | `#2E7D32` | Màu brand chính, CTA chính, icon ✓, trạng thái fresh/success |
| `color.brand.primaryHover` | `#25692A` | Hover/pressed của primary green |
| `color.brand.primaryActive` | `#1B5E20` | Active/pressed mạnh hơn |
| `color.brand.primarySoft` | `#E3F1E1` | Nền nhẹ cho empty state, success surface |
| `color.brand.primarySubtle` | `#F3FAF4` | Nền rất nhẹ cho section hoặc app shell |
| `color.brand.accent` | `#F7B23B` | Badge giảm giá, highlight, price drop |
| `color.brand.accentHover` | `#D99A22` | Hover/pressed của yellow accent |
| `color.brand.accentSoft` | `#FFF0D6` | Nền banner giữ giá, chip "Tiết kiệm" |
| `color.brand.accentText` | `#7A4A00` | Text trên nền vàng nhạt |

Chỉ dùng **3 màu thương hiệu**: xanh lá (hành động, thành công), vàng (deal, thời gian), cà chua (sắp hết, lỗi, hủy). Không thêm cam, xanh dương hay hồng. Viền chip deal dùng chính `color.brand.accent`.

### 2.2 Neutral

| Token | Hex | Vai trò |
| --- | --- | --- |
| `color.neutral.0` | `#FFFFFF` | Surface chính |
| `color.neutral.50` | `#FFFAF2` | App canvas warm cream |
| `color.neutral.100` | `#F7F4EF` | Section subtle, input background |
| `color.neutral.200` | `#EEE9E1` | Divider nhẹ |
| `color.neutral.300` | `#E1DBD1` | Border default |
| `color.neutral.400` | `#CFC8BC` | Border strong, disabled border |
| `color.neutral.500` | `#98A1AA` | Placeholder, muted icon |
| `color.neutral.600` | `#6B7680` | Secondary text |
| `color.neutral.700` | `#4B5560` | Body muted |
| `color.neutral.800` | `#2F3A44` | Body strong |
| `color.neutral.900` | `#1F2933` | Primary text |

### 2.3 Semantic

| Token | Hex | Vai trò |
| --- | --- | --- |
| `color.status.success` | `#2E7D32` | Thành công, completed, fresh |
| `color.status.successSoft` | `#E3F1E1` | Nền success |
| `color.status.warning` | `#F7B23B` | Cảnh báo nhẹ, countdown |
| `color.status.warningSoft` | `#FFF0D6` | Nền warning |
| `color.status.danger` | `#C43A28` | Lỗi, hủy, sắp hết (chữ trắng trên nền này khoảng 5.3:1) |
| `color.status.dangerSoft` | `#FFE8E3` | Nền danger |

### 2.4 App Surfaces

| Token | Value | Vai trò |
| --- | --- | --- |
| `color.bg.canvas` | `color.neutral.50` | Nền tổng app |
| `color.bg.surface` | `color.neutral.0` | Card, modal, bottom sheet |
| `color.bg.subtle` | `color.neutral.100` | Section nền nhẹ |
| `color.bg.elevated` | `color.neutral.0` | Floating surface |
| `color.border.default` | `color.neutral.300` | Border thường |
| `color.border.subtle` | `color.neutral.200` | Divider nhẹ |
| `color.border.strong` | `color.neutral.400` | Border nổi bật |

### 2.5 Text

| Token | Value | Vai trò |
| --- | --- | --- |
| `color.text.primary` | `color.neutral.900` | Heading, body chính |
| `color.text.secondary` | `color.neutral.700` | Body phụ |
| `color.text.muted` | `color.neutral.600` | Metadata |
| `color.text.placeholder` | `color.neutral.500` | Placeholder |
| `color.text.inverse` | `#FFFFFF` | Text trên nền đậm |
| `color.text.link` | `color.brand.primaryActive` | Link, nhấn chữ xanh đậm |

## 3. Action Tokens

| Token | Value | Ghi chú |
| --- | --- | --- |
| `color.action.primary.bg` | `color.brand.primary` | CTA chính mặc định |
| `color.action.primary.bgHover` | `color.brand.primaryHover` | Hover |
| `color.action.primary.bgActive` | `color.brand.primaryActive` | Pressed |
| `color.action.primary.text` | `#FFFFFF` | Text CTA xanh |
| `color.action.accent.bg` | `color.brand.accent` | CTA/highlight liên quan deal |
| `color.action.accent.text` | `#3A2A05` | Text trên vàng |
| `color.action.secondary.bg` | `color.brand.primarySoft` | Button phụ |
| `color.action.secondary.text` | `color.brand.primaryActive` | Text button phụ |
| `color.action.ghost.text` | `color.neutral.800` | Button ghost |
| `color.action.disabled.bg` | `color.neutral.200` | Disabled background |
| `color.action.disabled.text` | `color.neutral.500` | Disabled text |

## 4. Deal And Reservation Tokens

| Token | Value | Vai trò |
| --- | --- | --- |
| `color.deal.price` | `color.brand.primaryActive` | Giá hiện tại |
| `color.deal.originalPrice` | `color.neutral.500` | Giá cũ/gạch ngang |
| `color.deal.discountBg` | `color.brand.accent` | Badge giảm giá (nền vàng đặc) |
| `color.deal.discountText` | `color.action.accent.text` | Text badge giảm giá |
| `color.deal.stockBar` | `#6BAE70` | Thanh số phần còn lại (còn nhiều), xanh lá sáng |
| `color.deal.stockBarLow` | `#A52E1E` | Thanh số phần khi còn ≤ 30%, cà chua đậm |
| `color.deal.holdBannerBg` | `color.brand.accentSoft` | Banner "Giữ giá đến…" |
| `color.deal.holdBannerText` | `color.brand.accentText` | Text banner giữ giá |
| `color.deal.lowStockBg` | `color.status.dangerSoft` | Badge sắp hết |
| `color.deal.lowStockText` | `color.status.danger` | Text sắp hết |
| `color.reservation.active` | `color.brand.primary` | Đang giữ chỗ |
| `color.reservation.expiring` | `color.brand.accent` | Sắp hết TTL |
| `color.reservation.completed` | `color.status.success` | Đã lấy |
| `color.reservation.expired` | `color.neutral.500` | Hết hạn |
| `color.reservation.cancelled` | `color.status.danger` | Đã hủy |

## 5. Typography Tokens

Font đề xuất:

- Primary: `Inter`
- Alternative phù hợp tiếng Việt hơn: `Be Vietnam Pro`

| Token | Size | Line height | Weight | Dùng cho |
| --- | ---: | ---: | ---: | --- |
| `font.display` | 32 | 40 | 700 | Tiêu đề màn chính, page title |
| `font.h1` | 28 | 36 | 700 | Heading cấp 1 |
| `font.h2` | 22 | 30 | 650 | Heading section |
| `font.h3` | 18 | 26 | 650 | Card title, sheet title |
| `font.body` | 16 | 24 | 400 | Body chính |
| `font.bodyMedium` | 16 | 24 | 500 | Body nhấn nhẹ |
| `font.bodySmall` | 14 | 20 | 400 | Metadata, helper text |
| `font.label` | 14 | 20 | 600 | Label, tab, compact button |
| `font.caption` | 12 | 16 | 500 | Badge, timestamp |
| `font.price` | 20 | 28 | 700 | Giá deal |
| `font.cta` | 16 | 20 | 650 | Button text |

Trong `apps/lb-web`, các token này nằm ở `@theme` của `app/main.css` và dùng qua class Tailwind chuẩn, không viết `text-[28px]`:

| Class | Token | Size / line height |
| --- | --- | ---: |
| `text-xs` | `font.caption` | 12 / 16 |
| `text-sm` | `font.bodySmall`, `font.label` | 14 / 20 |
| `text-base` | `font.body`, `font.cta` | 16 / 24 |
| `text-lg` | `font.h3` | 18 / 26 |
| `text-xl` | `font.price` | 20 / 28 |
| `text-2xl` | `font.h2` | 22 / 30 |
| `text-3xl` | `font.h1` | 28 / 36 |
| `text-4xl` | `font.display` | 32 / 40 |

Màu tương tự: `brand`, `accent`, `danger` (kèm `-hover`, `-active`, `-soft`, `-text`) và `neutral-50…900` khớp bảng màu ở trên, ví dụ `bg-brand`, `text-neutral-700`, `bg-accent-soft`.

Nguyên tắc:

- Không scale font theo viewport width.
- Không dùng letter spacing âm.
- Giá và số lượng phải dễ scan trên mobile.
- Merchant UI dùng heading vừa phải, tránh cảm giác dashboard nặng.

## 6. Spacing Tokens

| Token | Value |
| --- | ---: |
| `space.0` | 0 |
| `space.1` | 4 |
| `space.2` | 8 |
| `space.3` | 12 |
| `space.4` | 16 |
| `space.5` | 20 |
| `space.6` | 24 |
| `space.8` | 32 |
| `space.10` | 40 |
| `space.12` | 48 |
| `space.16` | 64 |

Spacing dùng thang 4px mặc định của Tailwind (`p-4` = 16), khớp từng giá trị trên. Chỉ có ba token layout được đặt tên, khai báo trong `@theme` của `apps/lb-web/app/main.css`:

| Class | Value | Dùng cho |
| --- | ---: | --- |
| `max-w-app` | 448 | Khung mobile của một màn |
| `px-gutter` | 24 (`space.6`) | Lề ngang của trang |
| `h-touch` | 56 | Chiều cao tối thiểu nút chính và input merchant |

Chưa có grid nhiều cột hay breakpoint riêng: MVP mobile-first, màn rộng hơn 448 chỉ căn giữa khung.

Gợi ý sử dụng:

- Gap trong compact controls: `space.2` hoặc `space.3`.
- Padding card post: `space.4`.
- Padding bottom sheet: `space.5` hoặc `space.6`.
- Section spacing mobile: `space.6` đến `space.8`.

## 7. Radius Tokens

| Token | Value | Dùng cho |
| --- | ---: | --- |
| `radius.none` | 0 | Map/canvas edge |
| `radius.sm` | 8 | Ảnh nhỏ, banner, badge giảm giá |
| `radius.md` | 12 | Button, input, card |
| `radius.lg` | 20 | Bottom sheet (chỉ hai góc trên) |
| `radius.full` | 999 | Chip, pill, avatar, marker |

Nguyên tắc:

- Button, input và card cùng `radius.md` để cảm giác đồng nhất, dễ nhận ra vùng chạm.
- Không lạm dụng bo góc quá lớn để tránh cảm giác toy app.

### Border

| Token | Value | Dùng cho |
| --- | --- | --- |
| `border.default` | `1px solid color.neutral.300` | Card, thanh dưới |
| `border.control` | `1px solid color.neutral.400` | Input, chip chưa chọn, nút Google |
| `border.selected` | `2px solid color.brand.primary` | Focus, nút secondary, mã lấy hàng |
| `border.error` | `2px solid color.status.danger` | Input lỗi, nút hủy |
| `border.upload` | `2px dashed color.neutral.400` | Vùng tải ảnh |

Card phẳng: viền `border.subtle`, bo `radius.md`, không đổ bóng, vì trắng trên nền cream cần viền để tách. Chỉ bottom sheet, popover và nút nổi trên bản đồ có shadow.

### Kích thước chạm

| Vùng | Chiều cao tối thiểu | Lý do |
| --- | ---: | --- |
| Nút chính và input phía merchant | 56 | Tiểu thương thao tác một tay, tay ướt, ít bước |
| Nút giữ chỗ phía customer | 52 | CTA chính, bấm nhanh khi tranh phần cuối |
| Icon, ô tìm kiếm | 48 | |
| Chip, tab, liên kết | 44 | |
| Bottom nav | 64 | 3–4 mục, vừa tầm ngón cái |

Khoảng cách tối thiểu giữa hai vùng chạm là 8. Cỡ chữ nhỏ nhất là 14.

### Header (3 loại)

| Loại | Dùng cho | Quy tắc |
| --- | --- | --- |
| Tab (màn cấp 1) | Đã giữ, Tài khoản, Món hôm nay, Đơn giữ chỗ | Nền `neutral.50`, không viền, tiêu đề 22/30 đậm, tối đa một nút phụ bên phải. Khám phá là biến thể có logo và vị trí |
| Con (màn cấp 2) | Hồ sơ cửa hàng, Đăng món, Sửa món, Chi tiết món (cửa hàng) | Cao 56, nền trắng, viền dưới `border.default`, nút quay lại 48×48, tiêu đề 18 đậm |
| Phủ | Bản đồ, Chi tiết món (người mua) | Nổi trên nội dung: ô tìm kiếm nổi hoặc nút quay lại 48×48 trên ảnh |

### Nhãn nút và ngôn ngữ

- Nhãn nút bắt đầu bằng động từ, tối đa 3 từ hoặc 16 ký tự, không xuống dòng.
- Nút có padding ngang ít nhất 16 và rộng ít nhất 96.
- Chip lọc nhanh: tối đa 3 chip, mỗi chip dưới 10 ký tự, thấy hết không cần vuốt. Lọc thêm nằm trong Bộ lọc.
- Nhãn thanh điều hướng tối đa 8 ký tự.
- Mỗi thứ một tên: "món" là thứ được bán (không dùng "deal", "bài", "post" trên giao diện), "giữ chỗ" là thao tác của khách, "ngừng bán" là thao tác đóng sớm của cửa hàng.

| Thay vì | Dùng |
| --- | --- |
| Giữ 1 phần · 25.000đ | Giữ chỗ · 25.000đ |
| Đóng bài sớm | Ngừng bán sớm |
| Lấy trong 30 phút | Lấy ngay |
| Xóa lọc | Đặt lại |

### Không dựa vào màu một mình

Xanh và cà chua có độ sáng gần nhau, nên người mù màu đỏ-xanh khó phân biệt. Mọi trạng thái "sắp hết" phải có thêm ít nhất một tín hiệu khác ngoài màu:

- Chữ nói rõ ("Sắp hết · còn 3 phần").
- Icon cảnh báo đi kèm chip và dòng số phần.
- Thanh số phần dùng hai sắc độ khác hẳn nhau (`#6BAE70` sáng, `#A52E1E` đậm).

### Icon

- Bộ icon là `primeicons` (`pi pi-*`), gắn qua prop `icon` của Button, Tag, Message hoặc `<i class="pi pi-…">`.
- Màu và cỡ chữ theo token như chữ thường (`text-brand`, `text-danger`, `text-xl`); không tô màu ngoài palette.
- Icon bấm được phải nằm trong vùng chạm đủ lớn (48, xem Kích thước chạm), không chỉ là glyph.
- Icon báo trạng thái luôn kèm chữ. Logo và icon Google là SVG riêng (`AppLogo`, `GoogleIcon`), không thuộc bộ này.

## 8. Shadow Tokens

| Token | Value | Dùng cho |
| --- | --- | --- |
| `shadow.none` | `none` | Surface phẳng |
| `shadow.popover` | `0 8px 20px rgba(31, 41, 51, 0.12)` | Menu, popover |
| `shadow.sheet` | `0 12px 32px rgba(31, 41, 51, 0.16)` | Bottom sheet |
| `shadow.focus` | `0 0 0 3px rgba(46, 125, 50, 0.22)` | Focus ring |

## 9. Component Token Mapping

### 9.1 Customer Post Card

| Element | Token |
| --- | --- |
| Card background | `color.bg.surface` |
| Card border | `color.border.subtle` |
| Image radius | `radius.md` |
| Title text | `color.text.primary`, `font.h3` |
| Distance/meta | `color.text.muted`, `font.bodySmall` |
| Current price | `color.deal.price`, `font.price` |
| Discount badge | `color.deal.discountBg`, `color.deal.discountText`, `font.caption` |
| Low stock badge | `color.deal.lowStockBg`, `color.deal.lowStockText`, `font.caption` |

### 9.2 Primary Button

| State | Background | Text |
| --- | --- | --- |
| Default | `color.action.primary.bg` | `color.action.primary.text` |
| Hover | `color.action.primary.bgHover` | `color.action.primary.text` |
| Active | `color.action.primary.bgActive` | `color.action.primary.text` |
| Disabled | `color.action.disabled.bg` | `color.action.disabled.text` |

### 9.3 Deal/Countdown Badge

| Element | Token |
| --- | --- |
| Background | `color.brand.accentSoft` |
| Text | `color.text.primary` |
| Border | `color.brand.accent` |
| Font | `font.caption` |
| Radius | `radius.full` |

### 9.4 Merchant Post Row/Card

| Element | Token |
| --- | --- |
| Surface | `color.bg.surface` |
| Border | `color.border.default` |
| Title | `color.text.primary`, `font.h3` |
| Stats | `color.text.secondary`, `font.bodySmall` |
| Active status | `color.status.success` |
| Closed/expired status | `color.neutral.500` |
| Danger action | `color.status.danger` |

## 10. Figma Variable Naming

Gợi ý tạo variable collection:

- `Color / Brand`
- `Color / Neutral`
- `Color / Semantic`
- `Color / Surface`
- `Color / Text`
- `Color / Action`
- `Color / Deal`
- `Typography`
- `Spacing`
- `Radius`
- `Shadow`

Tên biến nên giữ dạng slash khi đưa vào Figma:

- `brand/primary`
- `brand/primary-hover`
- `brand/accent`
- `bg/canvas`
- `bg/surface`
- `text/primary`
- `action/primary/bg`
- `deal/discount-bg`
- `reservation/active`
- `space/4`
- `radius/md`

## 11. Brand Mark

Logo chính đã chốt là **takeaway food box**: hình hộp xanh lá, vết cắn ở góc phải và lá vàng nhấn. Nhận diện này gắn trực tiếp với món ăn sẵn sàng nhận, giá trị food-rescue và tính địa phương của LastBite.

| Asset | Dùng cho | Ghi chú |
| --- | --- | --- |
| [`docs/assets/lastbite-logo-mark.svg`](assets/lastbite-logo-mark.svg) | Logo chính, app icon, Figma | Vector phẳng, nền trong suốt; dùng ưu tiên |
| [`docs/assets/lastbite-logo-mark-v3-takeaway.png`](assets/lastbite-logo-mark-v3-takeaway.png) | Bản tham chiếu raster | Không dùng thay SVG trong UI production |

- Chỉ dùng `color.brand.primary` (`#2E7D32`), `color.brand.accent` (`#F7B23B`) và trắng trong mark.
- Giữ khoảng đệm xung quanh mark ít nhất bằng 25% chiều rộng logo; không bóp méo, đổ bóng hoặc đổi màu bite/leaf.
- Gradient nhẹ chỉ dùng trong mark chính: green `#3B9146 → #1B5E20` và gold `#F7B23B → #EE8A2B`; không dùng gradient ở icon UI, button hoặc badge.
- Với nền primary đậm, dùng bản trắng một màu riêng; không đảo màu trực tiếp bản màu.

## 12. Accessibility Notes

- CTA xanh `#2E7D32` dùng text trắng cho button chính (tương phản khoảng 5.2:1, tính tay).
- Nền vàng `#F7B23B` (badge giảm giá) dùng text tối `#3A2A05`, không dùng text trắng.
- Banner vàng nhạt `#FFF0D6` dùng text nâu đậm `#7A4A00`.
- Không dùng xanh lá nhạt làm text trên nền trắng.
- Focus ring dùng green alpha để rõ nhưng không neon.

