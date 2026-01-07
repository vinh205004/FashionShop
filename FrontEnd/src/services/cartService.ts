import axios from 'axios'; 
import type { ProductMock } from './mockProducts'; 

const API_URL = 'https://localhost:7248/api/Carts';
const STORAGE_KEY = 'fashion_shop_cart'; 

// 1. HELPER LẤY USER ID & TOKEN
const getCurrentUserId = (): number | null => {
  const userId = localStorage.getItem("userId"); 
  return userId ? parseInt(userId) : null; 
};

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

export interface CartItemDTO {
  id: number;
  title: string;
  price: number;
  images: string[];
  quantity: number;     
  stock: number;        
  sizes?: string[];
  selectedSize?: string;
  cartItemId?: number; 
  badges?: string[];
}

// 🔥 2. SMART MAPPER (GIỐNG ORDER SERVICE)
// Giúp bắt cả trường hợp Backend trả về PascalCase (Title) hoặc camelCase (title)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapCartItemFromBackend = (item: any): CartItemDTO => {
    // Helper lấy giá trị an toàn
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (obj: any, key: string) => obj?.[key] || obj?.[key.charAt(0).toUpperCase() + key.slice(1)];
    
    const product = val(item, 'product');
    
    // Xử lý ảnh an toàn
    const productImages = val(product, 'productImages') || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const images = Array.isArray(productImages) ? productImages.map((img: any) => val(img, 'imageUrl')) : [];

    // Xử lý sizes an toàn
    const productSizes = val(product, 'productSizes') || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sizes = Array.isArray(productSizes) ? productSizes.map((s: any) => val(s, 'sizeName')) : [];

    // Xử lý badges an toàn
    const productBadges = val(product, 'productBadges') || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const badges = Array.isArray(productBadges) ? productBadges.map((b: any) => val(b, 'badgeName')) : [];

    return {
        id: val(item, 'productId'),
        cartItemId: val(item, 'cartItemId'),
        title: product ? val(product, 'title') : "Sản phẩm lỗi",
        price: product ? val(product, 'price') : 0,
        stock: product ? (val(product, 'quantity') || 0) : 0, // Lấy tồn kho
        images: images.length > 0 ? images : ["https://via.placeholder.com/150"],
        badges: badges,
        quantity: val(item, 'quantity'),
        selectedSize: val(item, 'size'),
        sizes: sizes
    };
};

// 3. HÀM LẤY GIỎ HÀNG
export const fetchCart = async (): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();

  // CHẾ ĐỘ 1: GỌI API (User đã đăng nhập)
  if (userId) {
    try {
      // Thêm token vào header nếu cần bảo mật
      const res = await axios.get(`${API_URL}/${userId}`, getAuthHeader());
      
      const data = res.data;
      // Backend có thể trả về data.cartItems hoặc data.CartItems, hoặc mảng trực tiếp
      const itemsList = data.cartItems || data.CartItems || (Array.isArray(data) ? data : []);

      if (!Array.isArray(itemsList)) return [];

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return itemsList.map((item: any) => mapCartItemFromBackend(item));

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

// 4. HÀM THÊM VÀO GIỎ
export const addToCart = async (product: ProductMock, qty = 1): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  const size = product.selectedSize || ""; 

  if (userId) {
    try {
      await axios.post(`${API_URL}/add`, {
        userId: userId,
        productId: product.id,
        quantity: qty,
        size: size
      }, getAuthHeader()); // 🔥 Thêm Auth Header
    } catch (e) {
      console.error('Lỗi thêm giỏ API:', e);
    }
  } else {
    // Logic LocalStorage 
    const items = await fetchCart();
    const existingIndex = items.findIndex(i => i.id === product.id && i.selectedSize === size);
    
    const nextItems = [...items];
    if (existingIndex > -1) {
      nextItems[existingIndex].quantity += qty;
      // Update lại stock mới nhất
      nextItems[existingIndex].stock = product.quantity; 
    } else {
      const newItem: CartItemDTO = {
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        quantity: qty,
        stock: product.quantity, 
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

// 5. HÀM CẬP NHẬT SỐ LƯỢNG
export const updateCartItem = async (productId: number, size: string, qty: number): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  const findCondition = (i: CartItemDTO) => i.id === productId && (i.selectedSize || "") === (size || "");

  if (userId) {
    try {
      const items = await fetchCart();
      const itemToUpdate = items.find(findCondition);

      if (itemToUpdate && itemToUpdate.cartItemId) {
        await axios.put(`${API_URL}/update`, {
          cartItemId: itemToUpdate.cartItemId,
          quantity: qty
        }, getAuthHeader()); // 🔥 Thêm Auth Header
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

// 6. HÀM ĐỔI SIZE
export const updateCartItemSize = async (productId: number, selectedSize?: string): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
      const items = await fetchCart();
      const itemToUpdate = items.find(i => i.id === productId);

      if (itemToUpdate && itemToUpdate.cartItemId) {
        // 🔥 Logic an toàn hơn: Gửi cả số lượng hiện tại + size mới
        await axios.put(`${API_URL}/update`, {
          cartItemId: itemToUpdate.cartItemId,
          quantity: itemToUpdate.quantity, // Giữ nguyên số lượng
          size: selectedSize
        }, getAuthHeader());
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

// 7. XÓA SẢN PHẨM
export const removeCartItem = async (id: number, size: string): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  const sizeToDelete = size || ""; 

  if (userId) {
    try {
      const items = await fetchCart();
      const itemToDelete = items.find(i => i.id === id && (i.selectedSize || "") === sizeToDelete);
      
      if (itemToDelete && itemToDelete.cartItemId) {
        await axios.delete(`${API_URL}/remove/${itemToDelete.cartItemId}`, getAuthHeader());
      }
    } catch (e) {
      console.error("Lỗi xóa API:", e);
    }
  } else {
    const items = await fetchCart();
    const next = items.filter(i => !(i.id === id && (i.selectedSize || "") === sizeToDelete));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  
  return await fetchCart();
};

// 8. HÀM XÓA HẾT GIỎ
export const clearCart = async (): Promise<CartItemDTO[]> => {
  const userId = getCurrentUserId();
  
  if (userId) {
    try {
      await axios.delete(`${API_URL}/clear/${userId}`, getAuthHeader());
    } catch (e) {
      console.error("Lỗi xóa giỏ hàng API:", e);
    }
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
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