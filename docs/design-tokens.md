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
| `color.brand.primary` | `#2F8F5B` | Màu brand chính, CTA phụ, header accents, trạng thái fresh/success |
| `color.brand.primaryHover` | `#247247` | Hover/pressed của primary green |
| `color.brand.primaryActive` | `#1D5C39` | Active/pressed mạnh hơn |
| `color.brand.primarySoft` | `#E6F4EC` | Nền nhẹ cho badge, empty state, success surface |
| `color.brand.primarySubtle` | `#F3FAF6` | Nền rất nhẹ cho section hoặc app shell |
| `color.brand.accent` | `#F2B84B` | Deal, countdown, highlight, price drop |
| `color.brand.accentHover` | `#D99A22` | Hover/pressed của yellow accent |
| `color.brand.accentSoft` | `#FFF3D6` | Nền badge giảm giá, time-limited notice |
| `color.brand.accentText` | `#5F3B00` | Text trên nền vàng nhạt |

### 2.2 Neutral

| Token | Hex | Vai trò |
| --- | --- | --- |
| `color.neutral.0` | `#FFFFFF` | Surface chính |
| `color.neutral.50` | `#FFFCF7` | App canvas warm white |
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
| `color.status.success` | `#2F8F5B` | Thành công, completed, fresh |
| `color.status.successSoft` | `#E6F4EC` | Nền success |
| `color.status.warning` | `#F2B84B` | Cảnh báo nhẹ, countdown |
| `color.status.warningSoft` | `#FFF3D6` | Nền warning |
| `color.status.danger` | `#D94A38` | Lỗi, hủy, deal rất gấp |
| `color.status.dangerSoft` | `#FFE8E3` | Nền danger |
| `color.status.info` | `#2D7DD2` | Link phụ, map, thông tin |
| `color.status.infoSoft` | `#E7F1FC` | Nền info |

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
| `color.text.link` | `color.status.info` | Link |

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
| `color.deal.discountBg` | `color.brand.accentSoft` | Badge giảm giá |
| `color.deal.discountText` | `color.brand.accentText` | Text badge giảm giá |
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

Gợi ý sử dụng:

- Gap trong compact controls: `space.2` hoặc `space.3`.
- Padding card post: `space.4`.
- Padding bottom sheet: `space.5` hoặc `space.6`.
- Section spacing mobile: `space.6` đến `space.8`.

## 7. Radius Tokens

| Token | Value | Dùng cho |
| --- | ---: | --- |
| `radius.none` | 0 | Map/canvas edge |
| `radius.xs` | 4 | Badge nhỏ |
| `radius.sm` | 6 | Input, compact chip |
| `radius.md` | 8 | Card, button, image |
| `radius.lg` | 12 | Bottom sheet, modal |
| `radius.full` | 999 | Pill, avatar, marker |

Nguyên tắc:

- Card mặc định dùng `radius.md`.
- Không lạm dụng bo góc quá lớn để tránh cảm giác toy app.
- Ảnh món ăn nên dùng `radius.md` để sạch và rõ.

## 8. Shadow Tokens

| Token | Value | Dùng cho |
| --- | --- | --- |
| `shadow.none` | `none` | Surface phẳng |
| `shadow.card` | `0 1px 3px rgba(31, 41, 51, 0.10)` | Post card |
| `shadow.popover` | `0 8px 20px rgba(31, 41, 51, 0.12)` | Menu, popover |
| `shadow.sheet` | `0 12px 32px rgba(31, 41, 51, 0.16)` | Bottom sheet |
| `shadow.focus` | `0 0 0 3px rgba(47, 143, 91, 0.22)` | Focus ring |

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
| Text | `color.brand.accentText` |
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

## 11. Accessibility Notes

- CTA xanh `#2F8F5B` dùng text trắng ổn cho button chính.
- CTA vàng `#F2B84B` nên dùng text tối `#3A2A05`, không dùng text trắng.
- Badge vàng nhạt nên dùng text nâu đậm `#5F3B00`.
- Không dùng xanh lá nhạt làm text trên nền trắng.
- Focus ring dùng green alpha để rõ nhưng không neon.

