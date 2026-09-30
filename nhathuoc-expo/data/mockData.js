export const categories = [
  'Tất cả',
  'Vitamin',
  'Sức khỏe',
  'Dinh dưỡng',
  'Thuốc theo đơn',
  'Mẹ và bé',
];

export const products = [
  {
    id: 1,
    name: 'Vitamin C Plus',
    price: 289000,
    category: 'Vitamin',
    image:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80',
    badge: 'Bán chạy',
  },
  {
    id: 2,
    name: 'Thực phẩm bảo vệ sức khỏe',
    price: 420000,
    category: 'Dinh dưỡng',
    image:
      'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=900&q=80',
    badge: 'Mới',
  },
  {
    id: 3,
    name: 'Thuốc giảm đau',
    price: 95000,
    category: 'Thuốc theo đơn',
    image:
      'https://images.unsplash.com/photo-1607619056574-7b8d3ee536b2?auto=format&fit=crop&w=900&q=80',
    badge: 'Kê đơn',
  },
  {
    id: 4,
    name: 'Sữa bột tăng chiều cao',
    price: 560000,
    category: 'Mẹ và bé',
    image:
      'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80',
    badge: 'Yêu thích',
  },
];

export const services = [
  {
    title: 'Tư vấn sức khỏe',
    caption: 'Giải đáp cách dùng và lưu ý an toàn cùng dược sĩ.',
    icon: '💬',
  },
  {
    title: 'Đóng gói cẩn thận',
    caption: 'Sản phẩm được kiểm tra trước khi gửi đến bạn.',
    icon: '📦',
  },
  {
    title: 'Theo dõi đơn hàng',
    caption: 'Luôn nắm được tình trạng đơn từ lúc đặt đến khi nhận.',
    icon: '🕒',
  },
];

export const formatPrice = (value) => `${Number(value).toLocaleString('vi-VN')} ₫`;
