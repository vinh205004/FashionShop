import axios from 'axios';

const API_URL = 'https://localhost:7248/api/Vouchers';

// Định nghĩa kiểu dữ liệu cho Voucher hiển thị
export interface Voucher {
  id: number;
  code: string;
  title: string;
  description: string;
  minAmount: number;
  expiredAt: string;
  usageLimit?: number;
  usageCount?: number;
}
export interface VoucherValidation {
  isValid: boolean;
  discount: number;
  message: string;
}
export interface VoucherCheckResponse {
  message: string;
  discountAmount: number;
  code: string;
}

// 1. API Lấy danh sách voucher
export const getVouchers = async (): Promise<Voucher[]> => {
  try {
    const res = await axios.get(API_URL);
    // Map dữ liệu từ Backend sang Frontend interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return res.data.map((v: any) => ({
      id: v.voucherId,
      code: v.code,
      title: v.title,
      description: v.description,
      minAmount: v.minOrderValue,
      expiredAt: v.expiredAt
    }));
  } catch (error) {
    console.error("Lỗi lấy danh sách voucher:", error);
    return [];
  }
};

// 2. API Kiểm tra voucher (Code cũ giữ nguyên)
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

// 3. Hàm tương thích cho component cũ (nếu component bạn dùng tên là validateVoucher)
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