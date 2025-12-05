/**
 * Định nghĩa các loại thanh toán và đơn hàng
 */

export type PaymentMethodType = 'cash' | 'momopay' | 'vnpay';

export interface PaymentMethod {
  id: PaymentMethodType;
  name: string;
  description: string;
  icon: string;
  fee?: number; // phí thanh toán (%)
  estimatedTime?: string;
  isActive: boolean;
}

export interface OrderItem {
  id: number;
  title: string;
  price: number;
  quantity: number;
  selectedSize?: string;
  images: string[];
  badges?: string[];
}

export interface Order {
  id?: string;
  items: OrderItem[];
  subtotal: number;
  tax?: number;
  shipping?: number;
  discount?: number;
  total: number;
  paymentMethod: PaymentMethodType;
  customerInfo?: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    district: string;
    ward: string;
    postalCode?: string;
  };
  notes?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt?: string;
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  orderId?: string;
  paymentUrl?: string; // dành cho thanh toán online (MomoPay, VNPay)
  transactionId?: string;
}
