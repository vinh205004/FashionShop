import axios from 'axios';

// Cấu hình URL API (Thay port 7248 bằng port của bạn)
const API_URL = 'https://localhost:7248/api/Payment';

// Hàm lấy token
const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

// 1. ĐỊNH NGHĨA KIỂU DỮ LIỆU
export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  isActive: boolean;
}

// Interface trả về từ Backend
export interface PaymentResponse {
  success: boolean;
  message?: string;
  paymentUrl?: string; // URL để chuyển hướng sang VNPAY/MOMO
  paymentId?: string;  // Mã giao dịch hoặc ID thanh toán
}
export type PaymentMethodID = 'COD' | 'VNPAY' | 'MOMO' | 'BANKING';
// 2. DANH SÁCH PHƯƠNG THỨC THANH TOÁN (Khớp với Backend)
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'COD', // Backend đang check "COD" hoặc "VNPAY"
    name: 'Thanh toán khi nhận hàng (COD)',
    description: 'Thanh toán tiền mặt cho shipper khi nhận hàng',
    icon: '💵',
    isActive: true,
  },
  {
    id: 'VNPAY',
    name: 'VNPay QR / Ví VNPAY',
    description: 'Quét mã QR qua ứng dụng ngân hàng hoặc ví VNPAY',
    icon: '🏧',
    isActive: true,
  },
  {
    id: 'MOMO',
    name: 'Ví MoMo',
    description: 'Thanh toán qua ví điện tử MoMo',
    icon: '🟪',
    isActive: true, // Nếu chưa có backend MoMo thì để false
  },
  {
    id: 'BANKING',
    name: 'Chuyển khoản ngân hàng',
    description: 'Chuyển khoản trực tiếp tới STK cửa hàng',
    icon: '🏦',
    isActive: false, // Tạm ẩn
  },
];

// ==========================================================
// 3. CÁC HÀM GỌI API BACKEND
// ==========================================================

// API 1: TẠO GIAO DỊCH THANH TOÁN (Lấy URL redirect)
export const createPaymentAPI = async (
  orderId: number, 
  amount: number, 
  method: string
): Promise<PaymentResponse> => {
  try {
    // Backend cần có endpoint: POST /api/Payment/create-payment-url
    const res = await axios.post(`${API_URL}/create-payment-url`, {
      orderId,
      amount,
      paymentMethod: method.toUpperCase() // Đảm bảo gửi lên VNPAY, MOMO
    }, getAuthHeader());

    return { 
      success: true, 
      message: res.data.message,
      paymentUrl: res.data.paymentUrl, // Link để redirect
      paymentId: res.data.paymentId
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

// API 2: XÁC NHẬN THANH TOÁN 
// (Dùng để check trạng thái giao dịch nếu cần)
export const confirmPaymentAPI = async (paymentId: string): Promise<PaymentResponse> => {
  try {
    const res = await axios.get(`${API_URL}/confirm?paymentId=${paymentId}`, getAuthHeader());
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