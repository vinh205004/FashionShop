import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ProductMock } from '../services/mockProducts';
import * as cartService from '../services/cartService';

// 👇 1. Định nghĩa lại CartItem có trường stock
export interface CartItem {
  id: number;
  title: string;
  price: number;
  images: string[];
  quantity: number;     // Số lượng khách mua
  stock: number;        // 👇 QUAN TRỌNG: Số lượng tồn kho
  selectedSize?: string;
  badges?: string[];
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: ProductMock, qty?: number) => Promise<void>;
  removeFromCart: (id: number, size: string) => Promise<void>;
  updateQty: (id: number, size: string, qty: number) => Promise<void>;
  updateSize: (id: number, size?: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Load giỏ hàng khi mở web
  useEffect(() => {
    let mounted = true;
    const initCart = async () => {
      try {
        const data = await cartService.fetchCart();
        // Ép kiểu dữ liệu từ service về CartItem (đảm bảo có stock)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedData = data.map((item: any) => ({
            ...item,
            stock: item.stock !== undefined ? item.stock : 999 // Fallback nếu dữ liệu cũ chưa có stock
        }));
        
        if (mounted) setItems(mappedData);
      } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
      }
    };
    initCart();
    return () => { mounted = false; };
  }, []);

  // 2. Thêm sản phẩm
  const addToCart = async (product: ProductMock, qty = 1) => {
    try {
      // Gọi service để thêm
      const updatedItems = await cartService.addToCart(product, qty);
      
      // Cập nhật State
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(updatedItems as any); 
    } catch (e) {
      console.warn('Lỗi thêm giỏ hàng:', e);
    }
  };

  // 3. Xóa sản phẩm
  const removeFromCart = async (id: number, size: string) => {
    try {
      const updatedItems = await cartService.removeCartItem(id, size);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(updatedItems as any);
    } catch (e) {
      console.warn('Lỗi xóa sản phẩm:', e);
    }
  };

  // 4. Cập nhật số lượng
  const updateQty = async (id: number, size: string, qty: number) => {
    try {
      // Logic chặn số lượng đã được xử lý ở UI (Cart.tsx)
      // Ở đây chỉ việc gọi service update
      const updatedItems = await cartService.updateCartItem(id, size, qty);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(updatedItems as any);
    } catch (e) {
      console.warn('Lỗi cập nhật số lượng:', e);
    }
  };

  // 5. Cập nhật kích cỡ
  const updateSize = async (id: number, size?: string) => {
    try {
      const updatedItems = await cartService.updateCartItemSize(id, size);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(updatedItems as any);
    } catch (e) {
      console.warn('Lỗi cập nhật size:', e);
    }
  };

  // 6. Xóa hết
  const clear = async () => {
    try {
      const updatedItems = await cartService.clearCart();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setItems(updatedItems as any);
    } catch (e) {
      console.warn('Lỗi xóa giỏ hàng:', e);
    }
  };

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQty, updateSize, clear }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error('useCart must be used within CartProvider');
  return c;
};

export default CartContext;