import axios from 'axios';

// Cấu hình API
const API_URL = 'https://localhost:7248/api/Orders';

// ==========================================================
// 1. CÁC HÀM HELPER
// ==========================================================

const getCurrentUserId = (): number | null => {
  const userId = localStorage.getItem("userId");
  return userId ? parseInt(userId) : null; 
};

// Hàm lấy Token (Dùng cho các chức năng Admin hoặc bảo mật)
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

// ==========================================================
// 2. ĐỊNH NGHĨA INTERFACES (DTO)
// ==========================================================

// --- DTO CHO KHÁCH HÀNG (CLIENT) ---
export interface OrderDetailDTO {
  productId: number;
  productName: string;
  productImage: string;
  size: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDTO {
  orderId: number;
  orderDate: string;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  totalAmount: number;
  shippingFee: number;
  discountAmount: number;
  orderDetails: OrderDetailDTO[];
}

// --- DTO CHO ADMIN (Bảng danh sách đơn hàng) ---
export interface AdminOrder {
    orderId: number;
    orderDate: string;
    totalAmount: number;
    orderStatus: string;
    paymentMethod: string;
    paymentStatus: string;
    customerName: string;  // Tên hiển thị trong bảng Admin
    customerPhone: string; // SĐT hiển thị trong bảng Admin
}

// Kiểu dữ liệu gửi lên khi tạo đơn
interface CreateOrderPayload {
  userId: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  voucherCode?: string | null;
  selectedProductIds: number[];
}

// ==========================================================
// 3. MAPPER (Client Side)
// ==========================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderFromBackend = (data: any): OrderDTO => {
  return {
    orderId: data.orderId,
    orderDate: data.orderDate,
    receiverName: data.receiverName,
    receiverPhone: data.receiverPhone,
    shippingAddress: data.shippingAddress,
    orderStatus: data.orderStatus, 
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    totalAmount: data.totalAmount,
    shippingFee: data.shippingFee,
    discountAmount: data.discountAmount,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderDetails: data.orderDetails ? data.orderDetails.map((d: any) => ({
      productId: d.productId,
      productName: d.product?.title || "Sản phẩm",
      productImage: d.product?.productImages?.[0]?.imageUrl || "",
      size: d.size,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      totalPrice: d.totalPrice
    })) : []
  };
};

// ==========================================================
// 4. API CHO KHÁCH HÀNG (CLIENT ACTIONS)
// ==========================================================
export const cancelOrder = async (orderId: number) => {
    try {
        const res = await axios.put(`${API_URL}/cancel/${orderId}`, {}, getAuthHeader());
        return res.data;
    } catch (error) {
        console.error("Lỗi hủy đơn:", error);
        throw error;
    }
};
// TẠO ĐƠN HÀNG MỚI (CHECKOUT)
export const createOrderAPI = async (
  receiverName: string,
  receiverPhone: string,
  shippingAddress: string,
  paymentMethod: string = "COD",
  voucherCode?: string | null,
  selectedProductIds: number[] = []
): Promise<{ success: boolean; orderId?: number; message?: string }> => {
  
  const userId = getCurrentUserId();
  if (!userId) {
    return { success: false, message: "Vui lòng đăng nhập để đặt hàng!" };
  }
  const payload: CreateOrderPayload = {
    userId,
    receiverName,
    receiverPhone,
    shippingAddress,
    paymentMethod,
    voucherCode,
    selectedProductIds
  };

  try {
    const res = await axios.post(`${API_URL}/create`, payload);
    return { 
      success: true, 
      orderId: res.data.orderId, 
      message: res.data.message 
    };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Lỗi tạo đơn hàng:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Đặt hàng thất bại" 
    };
  }
};

// LẤY LỊCH SỬ ĐƠN HÀNG CỦA TÔI
export const getMyOrders = async (): Promise<OrderDTO[]> => {
  const userId = getCurrentUserId();
  try {
    const res = await axios.get(`${API_URL}/user/${userId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((item: any) => mapOrderFromBackend(item));
  } catch (error) {
    console.error("Lỗi lấy lịch sử đơn hàng:", error);
    return [];
  }
};

// LẤY CHI TIẾT 1 ĐƠN HÀNG
export const getOrderDetail = async (orderId: number): Promise<OrderDTO | null> => {
  try {
    const res = await axios.get(`${API_URL}/detail/${orderId}`);
    return mapOrderFromBackend(res.data);
  } catch (error) {
    console.error("Lỗi lấy chi tiết đơn hàng:", error);
    return null;
  }
};

// ==========================================================
// 5. API CHO QUẢN TRỊ VIÊN (ADMIN ACTIONS)
// ==========================================================

// Lấy tất cả đơn hàng (cho trang OrderManager)
export const getAllOrdersAdmin = async (): Promise<AdminOrder[]> => {
    try {
        // Cần có Token Admin mới gọi được
        const res = await axios.get(`${API_URL}/admin`, getAuthHeader());
        return res.data;
    } catch (error) {
        console.error("Lỗi lấy danh sách đơn hàng Admin:", error);
        return [];
    }
};

// Cập nhật trạng thái đơn hàng (Duyệt/Hủy)
export const updateOrderStatus = async (id: number, status: string) => {
    try {
        const res = await axios.put(`${API_URL}/status/${id}`, { status }, getAuthHeader());
        return res.data;
    } catch (error) {
        console.error("Lỗi cập nhật trạng thái:", error);
        throw error;
    }
};