import axios from 'axios'; 
import type { ProductMock } from './mockProducts'; 

const API_URL = 'https://localhost:7248/api/Carts';
const STORAGE_KEY = 'fashion_shop_cart'; 

const getCurrentUserId = (): number | null => {
  const userId = localStorage.getItem("userId"); 
  return userId ? parseInt(userId) : null; 
};

export interface CartItemDTO {
  id: number;
  title: string;
  price: number;
  images: string[];
  quantity: number;
  sizes?: string[];
  selectedSize?: string;
  cartItemId?: number; 
  badges?: string[];
}

// 1. HÀM LẤY GIỎ HÀNG
export const fetchCart = async (): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();

  // CHẾ ĐỘ 1: GỌI API (User đã đăng nhập)
  if (userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      if (!res.data || !res.data.cartItems) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res.data.cartItems.map((item: any) => ({
        id: item.productId,
        cartItemId: item.cartItemId,
        title: item.product.title,
        price: item.product.price,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        images: item.product.productImages?.map((img: any) => img.imageUrl) || [],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        badges: item.product.productBadges?.map((b: any) => b.badgeName) || [],
        quantity: item.quantity,
        selectedSize: item.size,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sizes: item.product.productSizes?.map((s: any) => s.sizeName) || [] 
      }));
    } catch (e) {
      console.error('Lỗi API Cart:', e);
      return [];
    }
  } 
  
  // CHẾ ĐỘ 2: LOCAL STORAGE
  else {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }
};

// 2. HÀM THÊM VÀO GIỎ
export const addToCart = async (product: ProductMock, qty = 1): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  const size = product.selectedSize || ""; // Nếu không chọn thì lưu rỗng

  if (userId) {
    try {
      await axios.post(`${API_URL}/add`, {
        userId: userId,
        productId: product.id,
        quantity: qty,
        size: size
      });
    } catch (e) {
      console.error('Lỗi thêm giỏ API:', e);
    }
  } else {
    // Logic LocalStorage 
    const items = await fetchCart();
    // Tìm xem món này + size này đã có chưa?
    const existingIndex = items.findIndex(i => i.id === product.id && i.selectedSize === size);
    
    const nextItems = [...items];
    if (existingIndex > -1) {
      // Có rồi -> Cộng dồn
      nextItems[existingIndex].quantity += qty;
    } else {
      // Chưa có -> Thêm mới
      const newItem: CartItemDTO = {
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        quantity: qty,
        selectedSize: size,
        sizes: product.sizes,
        badges: product.badges
      };
      nextItems.push(newItem);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems));
  }
  return await fetchCart();
};

// 3. HÀM CẬP NHẬT SỐ LƯỢNG
export const updateCartItem = async (productId: number, size: string, qty: number): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  
  // Logic tìm item chuẩn xác: Phải trùng cả ID và Size
  const findCondition = (i: CartItemDTO) => i.id === productId && (i.selectedSize || "") === (size || "");

  if (userId) {
    try {
      const items = await fetchCart();
      // Tìm item dựa trên cả ID và Size
      const itemToUpdate = items.find(findCondition);

      if (itemToUpdate && itemToUpdate.cartItemId) {
        await axios.put(`${API_URL}/update`, {
          cartItemId: itemToUpdate.cartItemId,
          quantity: qty
        });
      }
    } catch (e) {
      console.error("Lỗi update số lượng:", e);
    }
  } else {
    // Logic LocalStorage
    const items = await fetchCart();
    const next = items.map(i => 
      findCondition(i) ? { ...i, quantity: Math.max(1, qty) } : i
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  
  return await fetchCart();
};

// 4. HÀM ĐỔI SIZE
export const updateCartItemSize = async (productId: number, selectedSize?: string): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
      const items = await fetchCart();
      const itemToUpdate = items.find(i => i.id === productId);

      if (itemToUpdate && itemToUpdate.cartItemId) {
        await axios.put(`${API_URL}/update`, {
          cartItemId: itemToUpdate.cartItemId,
          quantity: 0, // Giữ nguyên số lượng
          size: selectedSize
        });
      }
    } catch (e) {
      console.error("Lỗi đổi size:", e);
    }
  } else {
    const items = await fetchCart();
    const next = items.map(i => i.id === productId ? { ...i, selectedSize } : i);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return await fetchCart();
};

// 5. XÓA SẢN PHẨM
export const removeCartItem = async (id: number, size: string): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  // Chuẩn hóa size (tránh null/undefined)
  const sizeToDelete = size || ""; 

  if (userId) {
    try {
      const items = await fetchCart();
      // Tìm item khớp cả ID và Size để lấy đúng cartItemId trong SQL
      const itemToDelete = items.find(i => i.id === id && (i.selectedSize || "") === sizeToDelete);
      
      if (itemToDelete && itemToDelete.cartItemId) {
        await axios.delete(`${API_URL}/remove/${itemToDelete.cartItemId}`);
        console.log(">> Đã xóa khỏi SQL Server");
      }
    } catch (e) {
      console.error("Lỗi xóa API:", e);
    }
  } else {
    // Logic LocalStorage: Giữ lại những món KHÔNG trùng (ID + Size)
    const items = await fetchCart();
    const next = items.filter(i => !(i.id === id && (i.selectedSize || "") === sizeToDelete));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  
  return await fetchCart();
};

// 6. HÀM XÓA HẾT GIỎ
export const clearCart = async (): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
// GỌI API DELETE
      await axios.delete(`${API_URL}/clear/${userId}`);
      console.log(">> Đã xóa sạch giỏ hàng trên SQL Server");
    } catch (e) {
      console.error("Lỗi xóa giỏ hàng API:", e);
    }
  } else {
    // Xóa LocalStorage (cho khách vãng lai)
    localStorage.removeItem(STORAGE_KEY);
  }
  
  // Trả về mảng rỗng để UI cập nhật
  return [];
};

export default { 
  fetchCart, 
  addToCart, 
  updateCartItem, 
  updateCartItemSize, 
  removeCartItem, 
  clearCart 
};