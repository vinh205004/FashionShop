import { useState, useEffect } from 'react';
import { PAYMENT_METHODS, type PaymentMethodID } from '../services/paymentService'; 
import { createOrderAPI } from '../services/orderService'; 
import { useToast } from '../contexts/ToastContext';

interface OrderProp {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[];
  subtotal: number;
  shipping?: number;
  discount?: number;
  total: number;
}

interface CheckoutModalProps {
  open: boolean;
  order: OrderProp | null;
  onClose: () => void;
  onSuccess: (orderId: string) => void;
}

export default function CheckoutModal({ open, order, onClose, onSuccess }: CheckoutModalProps) {
  const { addToast } = useToast();
  
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodID>('COD');
  
  const [paymentMethods] = useState(PAYMENT_METHODS);
  const [loading, setLoading] = useState(false);
  
  // State Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Animation controls
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setTimeout(() => setVisible(true), 10);
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open && !visible) return null;

  const closeWithAnimation = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const handlePayment = async () => {
    if (!customerName.trim()) { addToast('Vui lòng nhập tên khách hàng', 'error'); return; }
    if (!customerPhone.trim()) { addToast('Vui lòng nhập số điện thoại', 'error'); return; }
    if (!customerAddress.trim()) { addToast('Vui lòng nhập địa chỉ giao hàng', 'error'); return; }

    setLoading(true);
    try {
      const appliedVoucher = localStorage.getItem('appliedVoucher');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const selectedIds = order?.items.map((item: any) => item.id) || [];
      const result = await createOrderAPI(
        customerName,
        customerPhone,
        customerAddress,
        selectedMethod, 
        appliedVoucher,
        selectedIds
      );

      if (result.success && result.orderId) {
        addToast(`Đặt hàng thành công! Mã đơn #${result.orderId}`, 'success');
        
        localStorage.removeItem('checkoutSelectedIds');
        localStorage.removeItem('appliedVoucher');
        localStorage.removeItem('voucherDiscount');
        localStorage.removeItem('selectedCartIds');

        onSuccess(result.orderId.toString());
      } else {
        addToast(result.message || 'Đặt hàng thất bại', 'error');
      }

    } catch (error) {
      console.error('Payment error:', error);
      addToast('Có lỗi xảy ra khi kết nối server', 'error');
    } finally {
      setLoading(false);
    }
  };

  const selectedPaymentMethodObj = paymentMethods.find(m => m.id === selectedMethod);

  return (
    <div className="fixed inset-0 z-50">
      <div
        className={`absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300 ${
          visible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeWithAnimation}
      />

      <aside
        className={`absolute right-0 top-0 h-full bg-white w-full max-w-md shadow-xl transform transition-transform duration-300 ease-in-out overflow-y-auto ${
          visible ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white z-10">
          <h2 className="text-2xl font-bold">Thanh Toán</h2>
          <button onClick={closeWithAnimation} className="text-gray-500 hover:text-black text-2xl">✕</button>
        </div>

        <div className="p-6 pb-20">
          
          {/* Tóm tắt đơn hàng */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6 border">
            <h3 className="font-semibold mb-3">Đơn hàng của bạn</h3>
            <div className="space-y-2 text-sm mb-3 max-h-40 overflow-y-auto scrollbar-thin">
              {order?.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="truncate w-2/3">{item.title} x{item.quantity}</span>
                  <span className="font-medium">{(item.price * item.quantity).toLocaleString()} ₫</span>
                </div>
              ))}
            </div>
            <div className="border-t pt-3 space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{order?.subtotal.toLocaleString()} ₫</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Vận chuyển:</span>
                <span>{(order?.shipping || 0).toLocaleString()} ₫</span>
              </div>
              {order && (order.discount ||0)> 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Giảm giá:</span>
                  <span>-{(order.discount ||0).toLocaleString()} ₫</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                <span>Tổng cộng:</span>
                <span className="text-red-600">{order?.total.toLocaleString()} ₫</span>
              </div>
            </div>
          </div>

          {/* Form thông tin khách hàng */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Thông Tin Giao Hàng</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Họ và tên *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-black outline-none"
              />
              <input
                type="tel"
                placeholder="Số điện thoại *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-black outline-none"
              />
              <input
                type="text"
                placeholder="Địa chỉ nhận hàng *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-black outline-none"
              />
              <textarea
                placeholder="Ghi chú thêm (VD: Giao giờ hành chính)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={loading}
                className="w-full px-3 py-2 border rounded focus:ring-1 focus:ring-black outline-none h-20"
              />
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Phương Thức Thanh Toán</h3>
            <div className="space-y-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id as PaymentMethodID)} // id là COD, VNPAY...
                  disabled={!method.isActive || loading}
                  className={`w-full p-3 rounded border flex items-center gap-3 transition-all text-left ${
                    selectedMethod === method.id
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                      : 'border-gray-200 hover:border-gray-400'
                  } ${!method.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="text-2xl">{method.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{method.name}</div>
                    <div className="text-xs text-gray-500">{method.description}</div>
                  </div>
                  {selectedMethod === method.id && <span className="text-blue-600 font-bold">✓</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Hướng dẫn thanh toán */}
          {selectedPaymentMethodObj && (
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-800 mb-6 border border-blue-100">
              <strong>Lưu ý: </strong>
              {selectedMethod === 'COD' 
                ? 'Bạn sẽ thanh toán tiền mặt cho shipper khi nhận hàng.' 
                : 'Hệ thống sẽ chuyển hướng sang cổng thanh toán sau khi đặt hàng.'}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="absolute bottom-0 left-0 w-full bg-white border-t p-4 flex gap-3 shadow-lg">
          <button
            onClick={closeWithAnimation}
            disabled={loading}
            className="flex-1 px-4 py-3 border rounded font-semibold hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handlePayment}
            disabled={loading}
            className={`flex-1 px-4 py-3 bg-black text-white rounded font-semibold hover:bg-gray-800 transition-colors flex justify-center items-center gap-2 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
            {loading ? 'Đang xử lý...' : `Thanh Toán • ${order?.total.toLocaleString()} ₫`}
          </button>
        </div>

      </aside>
    </div>
  );
}