import axios from 'axios';

// Cấu hình API (Thay port 7248 bằng port của bạn)
const API_URL = 'https://localhost:7248/api/Orders';

const getCurrentUserId = (): number | null=> {
  const userId = localStorage.getItem("userId");
  return userId ? parseInt(userId) : null; 
};

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU (DTO)
// Khớp với dữ liệu trả về từ Backend (.NET)
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

// Kiểu dữ liệu gửi lên khi tạo đơn
interface CreateOrderPayload {
  userId: number;
  receiverName: string;
  receiverPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  voucherCode?: string | null;
}

// 2. HÀM MAP DỮ LIỆU (Backend -> Frontend)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderFromBackend = (data: any): OrderDTO => {
  return {
    orderId: data.orderId,
    orderDate: data.orderDate,
    receiverName: data.receiverName,
    receiverPhone: data.receiverPhone,
    shippingAddress: data.shippingAddress,
    orderStatus: data.orderStatus, // "Pending", "Completed"...
    paymentMethod: data.paymentMethod,
    paymentStatus: data.paymentStatus,
    totalAmount: data.totalAmount,
    shippingFee: data.shippingFee,
    discountAmount: data.discountAmount,
    // Map chi tiết đơn hàng
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderDetails: data.orderDetails ? data.orderDetails.map((d: any) => ({
      productId: d.productId,
      productName: d.product?.title || "Sản phẩm", // Lấy từ bảng Product nối sang
      productImage: d.product?.productImages?.[0]?.imageUrl || "",
      size: d.size,
      quantity: d.quantity,
      unitPrice: d.unitPrice,
      totalPrice: d.totalPrice
    })) : []
  };
};

// ==========================================================
// 3. CÁC HÀM GỌI API (ACTIONS)
// ==========================================================

// TẠO ĐƠN HÀNG MỚI (CHECKOUT)
export const createOrderAPI = async (
  receiverName: string,
  receiverPhone: string,
  shippingAddress: string,
  paymentMethod: string = "COD",
  voucherCode?: string | null
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
    voucherCode
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