import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import StoreHeader from '../components/StoreHeader';
import thuocService from '../services/thuocService';
import anhThuocService from '../services/anhThuocService';
import moTaThuocService from '../services/moTaThuocService';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../data/mockData';

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { addItem, count } = useCart();
  const [product, setProduct] = useState(null);
  const [description, setDescription] = useState(null);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      thuocService.getById(id),
      moTaThuocService.getById(id).catch(() => null),
      anhThuocService.getAll().catch(() => []),
    ])
      .then(([item, detail, images]) => {
        setProduct(item);
        setDescription(detail);
        setImage(images.find((itemImage) => String(itemImage.id_thuoc) === String(id)));
      })
      .catch((requestError) => setError(requestError.message || 'Không thể tải sản phẩm.'))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <ScrollView style={styles.container}>
      <StoreHeader cartCount={count} onCartPress={() => navigation.navigate('Cart')} onAccountPress={() => navigation.navigate('Login')} />
      {loading ? <ActivityIndicator style={styles.loader} size="large" color="#1d9bf0" /> : error ? <Text style={styles.error}>{error}</Text> : !product ? <Text style={styles.error}>Không tìm thấy sản phẩm.</Text> : (
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.back}>‹ Quay lại cửa hàng</Text></TouchableOpacity>
          <View style={styles.imageBox}>
            {image?.duong_dan_anh ? <Image source={{ uri: image.duong_dan_anh }} style={styles.image} resizeMode="cover" /> : <Text style={styles.placeholder}>💊</Text>}
          </View>
          <Text style={styles.kicker}>{product.loai_ke_don === 'ke_don' ? 'THUỐC KÊ ĐƠN' : 'THUỐC KHÔNG KÊ ĐƠN'}</Text>
          <Text style={styles.title}>{product.ten_thuoc}</Text>
          <Text style={styles.price}>{formatPrice(product.gia_ban)} <Text style={styles.unit}>/ {product.don_vi_tinh || 'sản phẩm'}</Text></Text>
          <Text style={styles.meta}>Mã sản phẩm: {product.ma_sku || `SP-${product.id}`} · Còn {product.so_luong_ton || 0} sản phẩm</Text>
          <TouchableOpacity style={styles.button} onPress={() => addItem({ id: product.id, name: product.ten_thuoc, price: Number(product.gia_ban) || 0, unit: product.don_vi_tinh, image: image?.duong_dan_anh })}>
            <Text style={styles.buttonText}>Thêm vào giỏ hàng</Text>
          </TouchableOpacity>
          <View style={styles.copy}>
            <Text style={styles.heading}>Công dụng</Text><Text style={styles.paragraph}>{description?.cong_dung || 'Thông tin đang được cập nhật.'}</Text>
            <Text style={styles.heading}>Hướng dẫn sử dụng</Text><Text style={styles.paragraph}>{description?.huong_dan_su_dung || 'Vui lòng đọc kỹ hướng dẫn hoặc hỏi ý kiến dược sĩ.'}</Text>
            <Text style={styles.heading}>Cảnh báo</Text><Text style={styles.paragraph}>{description?.canh_bao || 'Không tự ý sử dụng thuốc kê đơn khi chưa có chỉ định.'}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f9ff' },
  content: { padding: 20 },
  loader: { marginTop: 60 },
  error: { color: '#be123c', textAlign: 'center', padding: 30 },
  back: { color: '#1d9bf0', fontWeight: '700', marginBottom: 18 },
  imageBox: { height: 300, borderRadius: 20, overflow: 'hidden', backgroundColor: '#eaf2ff', marginBottom: 22 },
  image: { width: '100%', height: '100%' },
  placeholder: { flex: 1, textAlign: 'center', textAlignVertical: 'center', fontSize: 80 },
  kicker: { color: '#2cb67d', fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  title: { color: '#0f172a', fontSize: 28, fontWeight: '800', marginTop: 7 },
  price: { color: '#1d9bf0', fontWeight: '800', fontSize: 24, marginTop: 14 },
  unit: { color: '#64748b', fontSize: 14, fontWeight: '400' },
  meta: { color: '#64748b', marginTop: 8 },
  button: { backgroundColor: '#1d9bf0', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  copy: { marginTop: 28 },
  heading: { color: '#0f172a', fontWeight: '800', fontSize: 17, marginTop: 18 },
  paragraph: { color: '#475569', lineHeight: 22, marginTop: 6 },
});
