import axios from 'axios';

const API_URL = 'https://localhost:7248/api/Vouchers'; // Đổi port nếu cần

const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return { headers: { Authorization: `Bearer ${token}` } };
};

// Interface cho hiển thị trang chủ (User)
export interface Voucher {
  id: number;
  code: string;
  title: string;
  description: string;
  minAmount: number;
  expiredAt: string;
  // Các field khác nếu cần hiển thị
}

// Interface cho Admin quản lý (Full data)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface VoucherAdmin extends Voucher {
    discountType: string;
    discountValue: number;
    usageLimit: number;
    startDate: string;
    endDate: string;
    isActive: boolean;
}

export interface VoucherCheckResponse {
  message: string;
  discountAmount: number;
  code: string;
}

// =============================
// API CHO USER (PUBLIC)
// =============================

// 1. Lấy danh sách voucher khả dụng (Trang chủ)
export const getVouchers = async (): Promise<Voucher[]> => {
  try {
    // 🔥 Gọi vào endpoint 'available' thay vì root
    const res = await axios.get(`${API_URL}/available`);
    
    // Map dữ liệu từ Backend sang Frontend interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((v: any) => ({
      id: v.voucherId,
      code: v.code,
      title: v.title,         // Backend đã format sẵn title
      description: v.description, // Backend đã format sẵn description
      minAmount: v.minOrderValue,
      expiredAt: v.expiredAt
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách voucher:", error);
    return [];
  }
};

// 2. API Kiểm tra voucher (Checkout)
export const checkVoucherAPI = async (code: string, orderTotal: number): Promise<VoucherCheckResponse | null> => {
  try {
    const res = await axios.get(`${API_URL}/check`, {
      params: { code, orderTotal }
    });
    return res.data;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.response && error.response.data) {
      throw new Error(error.response.data.message);
    }
    throw new Error("Lỗi kết nối server");
  }
};

// 3. Hàm validation (Helper cho UI)
export const validateVoucher = async (code: string, total: number) => {
    try {
        const res = await checkVoucherAPI(code, total);
        return {
            isValid: true,
            discount: res?.discountAmount || 0,
            message: res?.message || "Áp dụng thành công"
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
        return {
            isValid: false,
            discount: 0,
            message: e.message
        };
    }
};

// =============================
// API CHO ADMIN (PRIVATE)
// =============================

// 4. Lấy tất cả voucher (Admin)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getAllVouchersAdmin = async (): Promise<any[]> => {
    try {
        const res = await axios.get(API_URL, getAuthHeader());
        return res.data;
    } catch  {
        return [];
    }
};

// 5. Tạo mới (Admin)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createVoucherAPI = async (voucher: any) => {
    try {
        const res = await axios.post(API_URL, voucher, getAuthHeader());
        return { success: true, message: res.data.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Lỗi tạo voucher" };
    }
};

// 6. Cập nhật (Admin)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const updateVoucherAPI = async (id: number, voucher: any) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, voucher, getAuthHeader());
        return { success: true, message: res.data.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Lỗi cập nhật" };
    }
};

// 7. Xóa (Admin)
export const deleteVoucherAPI = async (id: number) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`, getAuthHeader());
        return { success: true, message: res.data.message };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        return { success: false, message: error.response?.data?.message || "Lỗi xóa" };
    }
};