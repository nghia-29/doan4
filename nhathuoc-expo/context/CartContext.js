import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'nhathuoc_cart';
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => saved && setItems(JSON.parse(saved)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((total, item) => total + item.quantity, 0),
    total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    addItem: (product) => setItems((current) => {
      const existing = current.find((item) => String(item.id) === String(product.id));
      if (existing) {
        return current.map((item) => String(item.id) === String(product.id)
          ? { ...item, quantity: item.quantity + 1 }
          : item);
      }
      return [...current, { ...product, quantity: 1 }];
    }),
    increaseItem: (id) => setItems((current) => current.map((item) => String(item.id) === String(id)
      ? { ...item, quantity: item.quantity + 1 }
      : item)),
    decreaseItem: (id) => setItems((current) => current
      .map((item) => String(item.id) === String(id) ? { ...item, quantity: item.quantity - 1 } : item)
      .filter((item) => item.quantity > 0)),
    removeItem: (id) => setItems((current) => current.filter((item) => String(item.id) !== String(id))),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart phải được dùng bên trong CartProvider');
  return context;
}
