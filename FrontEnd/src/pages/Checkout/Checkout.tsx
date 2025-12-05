import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { createOrderAPI } from '../../services/orderService';
import { useAuth } from '../contexts/AuthContext'; 
import { PAYMENT_METHODS } from '../../services/paymentService';

interface CheckoutFormState {
  fullName: string;
  phone: string;
  address: string;
  paymentMethod: string;
}

export default function Checkout() {
  const { items, clear } = useCart();
  const { user } = useAuth(); 
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [selectedIds, setSelectedIds] = useState<Array<number>>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('checkoutSelectedIds');
      if (raw) setSelectedIds(JSON.parse(raw));
    } catch (err) { console.debug(err); }
  }, []);
  
  const checkoutItems = selectedIds.length > 0 
    ? items.filter(it => selectedIds.includes(it.id))
    : items;

  // Tính toán tiền
  const subtotal = checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  const shippingOptions = [
    { id: 'standard', label: 'Giao hàng tiêu chuẩn - 3-5 ngày', fee: 30000 },
    { id: 'express', label: 'Giao hàng nhanh - 1-2 ngày', fee: 50000 },
  ];
  const [shippingMethod, setShippingMethod] = useState(shippingOptions[0].id);
  const currentShipping = shippingOptions.find(s => s.id === shippingMethod)?.fee ?? 0;

  const appliedVoucher = localStorage.getItem('appliedVoucher');
  const discountRaw = localStorage.getItem('voucherDiscount');
  const discount = discountRaw ? parseInt(discountRaw, 10) : 0;

  const total = subtotal + currentShipping - discount;


  const [formData, setFormData] = useState<CheckoutFormState>({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'COD'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4. AUTO-FILL
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev, 
        fullName: user.fullName || '',
        phone: user.phone || '',     
        address: user.address || '' 
      }));
    }
  }, [user]); 

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName || !formData.phone || !formData.address) {
      addToast('Vui lòng điền đầy đủ thông tin giao hàng', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createOrderAPI(
        formData.fullName,
        formData.phone,
        formData.address,
        formData.paymentMethod,
        appliedVoucher
      );

      if (result.success) {
        addToast(`Đặt hàng thành công! Mã đơn: #${result.orderId}`, 'success');
        
        // Dọn dẹp
        localStorage.removeItem('checkoutSelectedIds');
        localStorage.removeItem('appliedVoucher');
        localStorage.removeItem('voucherDiscount');
        clear(); 

        navigate(`/orders/${result.orderId}`);
      } else {
        addToast(result.message || 'Đặt hàng thất bại', 'error');
      }
    } catch (error) {
      console.error(error);
      addToast('Có lỗi xảy ra khi kết nối server', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutItems.length === 0) {
    return <div className="text-center p-10">Không có sản phẩm để thanh toán</div>;
  }

  return (
    <div className="max-w-6xl mx-auto my-10 px-6">
      <h1 className="text-3xl font-bold mb-8 text-center">Thanh Toán</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: FORM NHẬP LIỆU */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">1. Thông tin giao hàng</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Họ tên người nhận <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Nguyễn Văn A"
                  value={formData.fullName} // Binding dữ liệu
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="tel" 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="0987654321"
                  value={formData.phone} // Binding dữ liệu
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ nhận hàng <span className="text-red-500">*</span></label>
                <input 
                  required
                  type="text" 
                  className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-black focus:outline-none"
                  placeholder="Số nhà, đường, phường/xã, quận/huyện..."
                  value={formData.address} // Binding dữ liệu
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
            </div>
          </div>

          {/* Phương thức vận chuyển & Thanh toán */}
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">2. Vận chuyển & Thanh toán</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Vận chuyển:</label>
              <select 
                className="w-full border rounded px-3 py-2"
                value={shippingMethod}
                onChange={(e) => setShippingMethod(e.target.value)}
              >
                {shippingOptions.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} ({opt.fee.toLocaleString('vi-VN')}₫)
                  </option>
                ))}
              </select>
            </div>

            <div>
  <label className="block text-sm font-medium mb-2">Thanh toán:</label>
  <div className="space-y-2">
    {PAYMENT_METHODS.map((method) => (
      <label 
        key={method.id}
        className={`flex items-center gap-3 border p-3 rounded cursor-pointer transition-all ${
          formData.paymentMethod === method.id 
            ? 'border-black bg-gray-50 ring-1 ring-black' 
            : 'border-gray-200 hover:border-gray-400'
        } ${!method.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input 
          type="radio" 
          name="payment" 
          value={method.id}
          disabled={!method.isActive}
          checked={formData.paymentMethod === method.id}
          onChange={() => setFormData({ ...formData, paymentMethod: method.id })}
          className="accent-black w-4 h-4"
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 font-medium">
            <span>{method.icon}</span>
            <span>{method.name}</span>
          </div>
          <div className="text-xs text-gray-500">{method.description}</div>
        </div>
        {formData.paymentMethod === method.id && (
          <span className="text-black font-bold">✓</span>
        )}
      </label>
    ))}
  </div>
</div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded shadow sticky top-4">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Đơn hàng ({checkoutItems.length} món)</h2>
            
            <div className="max-h-60 overflow-y-auto mb-4 pr-1 scrollbar-thin">
              {checkoutItems.map(item => (
                <div key={item.id} className="flex gap-3 mb-3 text-sm">
                  <img src={item.images[0]} className="w-12 h-12 object-cover rounded border" />
                  <div className="flex-1">
                    <div className="font-medium line-clamp-1">{item.title}</div>
                    <div className="text-gray-500">SL: {item.quantity} x {item.price.toLocaleString()}đ</div>
                    {item.selectedSize && <div className="text-xs bg-gray-100 inline-block px-1 rounded">Size: {item.selectedSize}</div>}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tạm tính:</span>
                <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span>Phí vận chuyển:</span>
                <span>{currentShipping.toLocaleString('vi-VN')} ₫</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Voucher giảm:</span>
                  <span>-{discount.toLocaleString('vi-VN')} ₫</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold text-red-600 border-t pt-2 mt-2">
                <span>Tổng cộng:</span>
                <span>{total.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className={`w-full mt-6 py-3 rounded font-bold text-white transition-colors ${
                isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
              }`}
            >
              {isSubmitting ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}