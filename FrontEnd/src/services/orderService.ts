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

export interface Order { 
    orderId: number;
    fullName: string;      
    phone: string;         
    totalAmount: number;
    orderDate: string;
    orderStatus: string;
    paymentMethod: string;
    paymentStatus: string;
}

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
// 3. MAPPER (Client Side) - ĐÃ SỬA ĐỂ BẮT CẢ HOA/THƯỜNG
// ==========================================================
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapOrderFromBackend = (data: any): OrderDTO => {
  // Helper: Lấy giá trị dù key là 'orderId' hay 'OrderId'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const val = (key: string) => data[key] || data[key.charAt(0).toUpperCase() + key.slice(1)];

  return {
    orderId: val('orderId'),
    orderDate: val('orderDate'),
    receiverName: val('receiverName') || "Khách hàng",
    receiverPhone: val('receiverPhone') || "",
    shippingAddress: val('shippingAddress') || "",
    orderStatus: val('orderStatus'), 
    paymentMethod: val('paymentMethod'),
    paymentStatus: val('paymentStatus'),
    totalAmount: val('totalAmount'),
    shippingFee: val('shippingFee') || 0,
    discountAmount: val('discountAmount') || 0,
    
    // Xử lý mảng OrderDetails (bắt cả orderDetails lẫn OrderDetails)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    orderDetails: (val('orderDetails') || []).map((d: any) => {
      // Lấy product con (bắt cả product lẫn Product)
      const p = d.product || d.Product;
      
      // Lấy ảnh an toàn
      let imgUrl = "https://via.placeholder.com/150";
      if (p) {
          const imgs = p.productImages || p.ProductImages;
          if (imgs && imgs.length > 0) {
              imgUrl = imgs[0].imageUrl || imgs[0].ImageUrl;
          }
      }

      return {
        productId: d.productId || d.ProductId,
        productName: p ? (p.title || p.Title) : "Sản phẩm (Đã xóa)",
        productImage: imgUrl,
        size: d.size || d.Size,
        quantity: d.quantity || d.Quantity,
        unitPrice: d.unitPrice || d.UnitPrice,
        totalPrice: d.totalPrice || d.TotalPrice || ((d.quantity || d.Quantity) * (d.unitPrice || d.UnitPrice))
      };
    }) 
  };
};

// ==========================================================
// 4. API CHO KHÁCH HÀNG (CLIENT ACTIONS)
// ==========================================================

// TẠO ĐƠN HÀNG MỚI
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
    // Backend có thể trả về orderId hoặc OrderId
    return { 
      success: true, 
      orderId: res.data.orderId || res.data.OrderId, 
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
  
  if (!userId) return [];

  try {
    const res = await axios.get(`${API_URL}/user/${userId}`);
    if (!res.data) return [];
    
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

// CẬP NHẬT TRẠNG THÁI
export const updateOrderStatus = async (orderId: number, status: string) => {
    try {
        const res = await axios.put(
            `${API_URL}/status/${orderId}`, 
            { status: status }, 
            getAuthHeader()
        );
        return { success: true, message: res.data.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { 
            success: false, 
            message: error.response?.data?.message || "Lỗi cập nhật trạng thái" 
        };
    }
};

// ==========================================================
// 5. API CHO QUẢN TRỊ VIÊN (ADMIN ACTIONS)
// ==========================================================

export const getAllOrdersAdmin = async (): Promise<Order[]> => {
    try {
        const res = await axios.get(`${API_URL}/admin`, getAuthHeader());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return res.data.map((o: any) => ({
            orderId: o.orderId || o.OrderId,
            fullName: o.customerName || o.CustomerName, // Bắt cả 2 trường hợp
            phone: o.customerPhone || o.CustomerPhone,
            totalAmount: o.totalAmount || o.TotalAmount,
            orderDate: o.orderDate || o.OrderDate,
            orderStatus: o.orderStatus || o.OrderStatus,
            paymentMethod: o.paymentMethod || o.PaymentMethod,
            paymentStatus: o.paymentStatus || o.PaymentStatus
        }));
    } catch (error) {
        console.error("Lỗi lấy danh sách đơn hàng Admin:", error);
        return [];
    }
};