// Every leaf of a nested message object as a dotted path, e.g. "login.headline".
type MessagePath<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${MessagePath<T[K]>}`
}[keyof T & string]

// The same nesting with plain string leaves, so another language must define every message.
type MessageTree<T> = {
  [K in keyof T]: T[K] extends string ? string : MessageTree<T[K]>
}

// Source of truth for message keys: en.ts must define every key found here.
// One group level only ("group.key"), so a key never needs a long path.
const vi = {
  login: {
    headline: 'Bữa ngon cuối ngày, giá tốt gần bạn.',
    slogan: 'Giữ phần trước, ghé lấy đúng giờ.',
    heroAlt: 'Bánh mì cắt đôi trên đĩa trắng',
    benefitNearby: 'Món từ cửa hàng gần bạn',
    benefitPrice: 'Giá giảm rõ ràng',
    benefitPayment: 'Thanh toán trực tiếp',
    continueWithGoogle: 'Tiếp tục với Google',
    openingGoogle: 'Đang mở Google…',
    error: 'Có lỗi khi đăng nhập. Hãy thử lại sau ít phút.',
    retry: 'Thử lại',
    termsPrefix: 'Bằng việc tiếp tục, bạn đồng ý với',
    termsTerms: 'Điều khoản sử dụng',
    termsAnd: 'và',
    termsPrivacy: 'Chính sách quyền riêng tư',
  },
  error: {
    title: 'Có lỗi xảy ra',
    notFoundTitle: 'Không tìm thấy trang',
    notFound: 'Trang này không còn hoặc đường dẫn bị sai.',
    back: 'Quay lại',
    reload: 'Thử lại',
    generic: 'Đã có lỗi ngoài ý muốn. Hãy thử lại sau ít phút.',
    home: 'Về trang chủ',
  },
  merchant: {
    back: 'Quay lại',
    homeStore: 'Cửa hàng',
  },
  store: {
    loadingTitle: 'Đang tải cửa hàng',
    loadingDescription: 'Đợi một chút để lấy thông tin cửa hàng của bạn.',
    loadFailedTitle: 'Chưa tải được cửa hàng',
    loadFailedDescription: 'Kiểm tra mạng rồi thử lại.',
    retry: 'Thử lại',
    emptyTitle: 'Bạn chưa có cửa hàng',
    emptyDescription: 'Tạo cửa hàng để bắt đầu đăng món.',
    emptyCreate: 'Tạo cửa hàng',
    detailsOverline: 'Cửa hàng của tôi',
  },
  storeForm: {
    overline: 'Thiết lập cửa hàng',
    title: 'Tạo cửa hàng',
    description: 'Thông tin này sẽ hiển thị cho khách khi bạn đăng món.',
    alreadyExists: 'Bạn đã có cửa hàng.',
    showStore: 'Xem cửa hàng',
    nameLabel: 'Tên cửa hàng',
    namePlaceholder: 'Ví dụ: Bánh mì Cô Hai',
    phoneLabel: 'Số điện thoại',
    phonePlaceholder: '09xx xxx xxx',
    addressLabel: 'Địa chỉ',
    addressPlaceholder: 'Số nhà, đường, quận',
    save: 'Lưu',
    saving: 'Đang lưu…',
  },
  storeError: {
    title: 'Chưa lưu được cửa hàng',
    save: 'Kiểm tra mạng rồi thử lại.',
    nameRequired: 'Vui lòng nhập tên cửa hàng',
    invalid: 'Thông tin chưa hợp lệ.',
    nameInvalid: 'Tên cửa hàng từ {nameMin} đến {nameMax} ký tự',
    phoneRequired: 'Vui lòng nhập số điện thoại',
    phoneInvalid: 'Số điện thoại di động không hợp lệ',
    addressRequired: 'Vui lòng nhập địa chỉ',
    addressInvalid: 'Địa chỉ từ {addressMin} đến {addressMax} ký tự',
  },
}

export type MessageKey = MessagePath<typeof vi>
export type Messages = MessageTree<typeof vi>

export default vi
