import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ProductMock } from '../services/mockProducts';
import * as cartService from '../services/cartService';
import type { CartItemDTO } from '../services/cartService';


export type CartItem = CartItemDTO;

interface CartContextValue {
  items: CartItem[];
  addItem: (product: ProductMock, qty?: number) => Promise<void>;
  removeItem: (id: number, size: string) => Promise<void>;
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
        if (mounted) setItems(data);
      } catch (error) {
        console.error("Lỗi tải giỏ hàng:", error);
      }
    };
    initCart();
    return () => { mounted = false; };
  }, []);

  // 2. Thêm sản phẩm 
  const addItem = async (product: ProductMock, qty = 1) => {
    try {
      // Gọi service 
      const updatedItems = await cartService.addToCart(product, qty);
      // Cập nhật State bằng dữ liệu mới nhất trả về
      setItems(updatedItems);
    } catch (e) {
      console.warn('Lỗi thêm giỏ hàng:', e);
    }
  };

  // 3. Xóa sản phẩm
  const removeItem = async (id: number, size: string,) => {
    try {
      const updatedItems = await cartService.removeCartItem(id, size);
      setItems(updatedItems);
    } catch (e) {
      console.warn('Lỗi xóa sản phẩm:', e);
    }
  };

  // 4. Cập nhật số lượng
  const updateQty = async (id: number, size: string, qty: number) => {
    try {
      const updatedItems = await cartService.updateCartItem(id, size, qty);
      setItems(updatedItems);
    } catch (e) {
      console.warn('Lỗi cập nhật số lượng:', e);
    }
  };

  // 5. Cập nhật kích cỡ
  const updateSize = async (id: number, size?: string) => {
    try {
      const updatedItems = await cartService.updateCartItemSize(id, size);
      setItems(updatedItems);
    } catch (e) {
      console.warn('Lỗi cập nhật size:', e);
    }
  };

  // 6. Xóa hết
  const clear = async () => {
    try {
      const updatedItems = await cartService.clearCart();
      setItems(updatedItems);
    } catch (e) {
      console.warn('Lỗi xóa giỏ hàng:', e);
    }
  };

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, updateSize, clear }}>
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