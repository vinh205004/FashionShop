import axios from 'axios';

// Cấu hình URL API (Thay port 7248 bằng port của bạn)
const API_URL = 'https://localhost:7248/api/Payments';

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU
export type PaymentMethodType = 'cash' | 'momopay' | 'vnpay';

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  fee: number;
  estimatedTime?: string;
  isActive: boolean;
}

export interface PaymentResponse {
  success: boolean;
  message?: string;
  paymentId?: number; // Backend trả về ID thanh toán
  transactionId?: string;
}

// 2. DANH SÁCH PHƯƠNG THỨC THANH TOÁN (Tĩnh)
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'Thanh toán tiền mặt',
    description: 'Thanh toán khi nhận hàng (COD)',
    icon: '💵',
    fee: 0,
    estimatedTime: 'Giao hàng trong 24-48 giờ',
    isActive: true,
  },
  {
    id: 'momopay',
    name: 'Ví MoMo',
    description: 'Quét mã QR qua ứng dụng MoMo',
    icon: '🟪',
    fee: 0, // Thường là miễn phí
    estimatedTime: 'Xác nhận tức thì',
    isActive: true,
  },
  {
    id: 'vnpay',
    name: 'VNPay QR',
    description: 'Thanh toán qua app ngân hàng / VNPay',
    icon: '🏧',
    fee: 0,
    estimatedTime: 'Xác nhận tức thì',
    isActive: true,
  },
];

// ==========================================================
// 3. CÁC HÀM GỌI API BACKEND
// ==========================================================

// API 1: TẠO GIAO DỊCH THANH TOÁN
// Gọi khi khách bấm nút "Thanh toán ngay" ở trang chi tiết đơn
export const createPaymentAPI = async (
  orderId: number, 
  amount: number, 
  method: string
): Promise<PaymentResponse> => {
  try {
    const res = await axios.post(`${API_URL}/create`, {
      orderId,
      amount,
      paymentMethod: method.toUpperCase() // Backend cần chuỗi hoa (MOMOPAY, VNPAY)
    });

    return { 
      success: true, 
      message: res.data.message,
      paymentId: res.data.paymentId,
      transactionId: res.data.transactionId
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Lỗi tạo thanh toán:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Khởi tạo thanh toán thất bại" 
    };
  }
};

// API 2: XÁC NHẬN THANH TOÁN (Giả lập Callback từ Ngân hàng)
// Gọi sau khi khách quét mã xong (hoặc sau 2 giây demo)
export const confirmPaymentAPI = async (paymentId: number): Promise<PaymentResponse> => {
  try {
    const res = await axios.post(`${API_URL}/confirm/${paymentId}`);
    return { 
      success: true, 
      message: res.data.message 
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Lỗi xác nhận thanh toán:", error);
    return { 
      success: false, 
      message: error.response?.data?.message || "Xác nhận thanh toán thất bại" 
    };
  }
};

// Hàm lấy danh sách phương thức (dành cho UI nếu cần async)
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  return Promise.resolve(PAYMENT_METHODS);
};