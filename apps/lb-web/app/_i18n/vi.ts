// Source of truth for message keys: en.ts must define every key found here.
const vi = {
  'login.headline': 'Bữa ngon cuối ngày, giá tốt gần bạn.',
  'login.slogan': 'Giữ phần trước, ghé lấy đúng giờ.',
  'login.heroAlt': 'Bánh mì cắt đôi trên đĩa trắng',
  'login.benefit.nearby': 'Món từ cửa hàng gần bạn',
  'login.benefit.price': 'Giá giảm rõ ràng',
  'login.benefit.payment': 'Thanh toán trực tiếp',
  'login.continueWithGoogle': 'Tiếp tục với Google',
  'login.openingGoogle': 'Đang mở Google…',
  'login.error': 'Có lỗi khi đăng nhập. Hãy thử lại sau ít phút.',
  'login.retry': 'Thử lại',
  'login.terms.prefix': 'Bằng việc tiếp tục, bạn đồng ý với',
  'login.terms.terms': 'Điều khoản sử dụng',
  'login.terms.and': 'và',
  'login.terms.privacy': 'Chính sách quyền riêng tư',
  'error.title': 'Có lỗi xảy ra',
  'error.notFoundTitle': 'Không tìm thấy trang',
  'error.notFound': 'Trang này không còn hoặc đường dẫn bị sai.',
  'error.back': 'Quay lại',
  'error.reload': 'Thử lại',
  'error.generic': 'Đã có lỗi ngoài ý muốn. Hãy thử lại sau ít phút.',
  'error.home': 'Về trang chủ',
}

export type MessageKey = keyof typeof vi

export default vi
