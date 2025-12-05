import { useEffect, useState } from 'react';
import { getMyOrders, getOrderDetail, type OrderDTO } from '../../services/orderService'; 
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { createPaymentAPI, confirmPaymentAPI } from '../../services/paymentService';

export default function OrderTracking() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<number | null>(null); 
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // 1. Load danh sách đơn hàng (khi ở trang danh sách)
  useEffect(() => {
    if (!id) {
      (async () => {
        setLoading(true);
        const data = await getMyOrders();
        setOrders(data);
        setLoading(false);
      })();
    }
  }, [id]);

  // 2. Load chi tiết đơn hàng (khi có ID trên URL)
  useEffect(() => {
    if (id) {
      (async () => {
        setLoading(true);
        const data = await getOrderDetail(parseInt(id));
        if (data) {
          setDetailOrder(data);
        } else {
          addToast("Không tìm thấy đơn hàng", "error");
          navigate('/orders');
        }
        setLoading(false);
      })();
    }
  }, [id, navigate, addToast]);

  const handleCancel = (orderId: number) => {
    setTargetOrderId(orderId);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!targetOrderId) return;
    
    // TODO: Gọi API hủy đơn (Bạn cần viết thêm API CancelOrder ở Backend sau này)
    // Tạm thời chỉ thông báo demo
    addToast("Chức năng hủy đơn đang phát triển", "info");
    setConfirmOpen(false);
    
    // Nếu muốn làm thật:
    // const res = await cancelOrderAPI(targetOrderId);
    // if (res.success) { refresh(); }
  };

  // Hiển thị Loading
  if (loading) return <div className="max-w-4xl mx-auto my-10 px-6 text-center">Đang tải dữ liệu...</div>;

  // --- TRƯỜNG HỢP 1: XEM CHI TIẾT ĐƠN HÀNG ---
  if (id && detailOrder) {
    const handlePayment = async (order: OrderDTO) => {
    if (!order) return;
    
    addToast("Đang kết nối cổng thanh toán...", "info");
    
    // 1. Tạo giao dịch
    const res = await createPaymentAPI(order.orderId, order.totalAmount, order.paymentMethod);
    
    if (res.success && res.paymentId) {
      // 2. Giả lập thanh toán thành công sau 2s
      addToast("Đang xử lý giao dịch...", "info");
      
      setTimeout(async () => {
        const confirmRes = await confirmPaymentAPI(res.paymentId!);
        if (confirmRes.success) {
          addToast("Thanh toán thành công!", "success");
          // Reload lại trang để cập nhật trạng thái mới (Paid)
          window.location.reload();
        } else {
          addToast("Thanh toán thất bại", "error");
        }
      }, 2000);
      
    } else {
      addToast(res.message || "Lỗi tạo thanh toán", "error");
    }
  };
    return (
      <div className="max-w-4xl mx-auto my-10 px-6">
        <h1 className="text-2xl font-bold mb-4">Chi tiết đơn hàng #{detailOrder.orderId}</h1>
        <div className="bg-white p-6 rounded shadow">
          
          {/* Thông tin chung */}
          <div className="mb-6 grid grid-cols-2 gap-4">
            <div>
              <p className="text-gray-600">Ngày đặt:</p>
              <p className="font-semibold">{new Date(detailOrder.orderDate).toLocaleString('vi-VN')}</p>
            </div>
            <div>
              <p className="text-gray-600">Trạng thái:</p>
              <span className={`px-2 py-1 rounded text-sm font-semibold 
                ${detailOrder.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 
                  detailOrder.orderStatus === 'Completed' ? 'bg-green-100 text-green-800' : 
                  'bg-gray-100 text-gray-800'}`}>
                {detailOrder.orderStatus}
              </span>
            </div>
            <div>
              <p className="text-gray-600">Người nhận:</p>
              <p className="font-semibold">{detailOrder.receiverName} - {detailOrder.receiverPhone}</p>
            </div>
            <div>
              <p className="text-gray-600">Địa chỉ:</p>
              <p className="font-semibold">{detailOrder.shippingAddress}</p>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Sản phẩm</h3>
            {detailOrder.orderDetails.map((item, index) => (
              <div key={index} className="flex gap-4 py-3 border-b last:border-0">
                <img src={item.productImage || "https://via.placeholder.com/80"} className="w-16 h-16 object-cover rounded border" />
                <div className="flex-1">
                  <div className="font-semibold">{item.productName}</div>
                  <div className="text-sm text-gray-600">Size: {item.size} | SL: {item.quantity}</div>
                </div>
                <div className="font-semibold">{item.totalPrice.toLocaleString('vi-VN')} ₫</div>
              </div>
            ))}

            {/* Tổng tiền */}
            <div className="pt-4 mt-4 bg-gray-50 p-4 rounded">
              <div className="flex justify-between mb-2">
                <div>Phí vận chuyển</div>
                <div>{detailOrder.shippingFee.toLocaleString('vi-VN')} ₫</div>
              </div>
              {detailOrder.discountAmount > 0 && (
                <div className="flex justify-between text-green-600 mb-2">
                  <div>Giảm giá voucher</div>
                  <div>-{detailOrder.discountAmount.toLocaleString('vi-VN')} ₫</div>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                <div>Tổng cộng</div>
                <div className="text-red-600">{detailOrder.totalAmount.toLocaleString('vi-VN')} ₫</div>
              </div>
            </div>
              {detailOrder.paymentStatus === 'Unpaid' && detailOrder.paymentMethod !== 'COD' && detailOrder.orderStatus !== 'Cancelled' && (
  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded animate-pulse">
    <p className="text-blue-800 mb-2 font-medium flex items-center gap-2">
      <span>⚠️</span> Đơn hàng chưa được thanh toán.
    </p>
    <button 
      onClick={() => handlePayment(detailOrder)}
      className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center gap-2"
    >
      THANH TOÁN NGAY ({detailOrder.totalAmount.toLocaleString('vi-VN')} ₫)
    </button>
  </div>
)}
            {/* Nút thao tác */}
            <div className="mt-6 flex gap-3">
              {detailOrder.orderStatus === 'Pending' && (
                <button onClick={() => handleCancel(detailOrder.orderId)} className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">Hủy đơn</button>
              )}
              <button onClick={() => navigate('/orders')} className="px-4 py-2 border rounded hover:bg-gray-100">Quay lại danh sách</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- TRƯỜNG HỢP 2: XEM DANH SÁCH ĐƠN HÀNG ---
  return (
    <div className="max-w-4xl mx-auto my-10 px-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử đơn hàng của tôi</h1>
      {orders.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="text-gray-500 mb-4">Bạn chưa có đơn hàng nào.</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-black text-white rounded">Mua sắm ngay</button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.orderId} className="bg-white p-4 rounded shadow flex justify-between items-center hover:shadow-md transition">
              <div>
                <div className="font-bold text-lg">Đơn hàng #{o.orderId}</div>
                <div className="text-sm text-gray-500">Ngày đặt: {new Date(o.orderDate).toLocaleDateString('vi-VN')}</div>
                <div className="text-sm font-semibold mt-1 text-red-600">Tổng: {o.totalAmount.toLocaleString('vi-VN')} ₫</div>
              </div>
              <div className="text-right">
                <span className={`block mb-2 px-2 py-1 rounded text-xs font-bold text-center
                  ${o.orderStatus === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                  {o.orderStatus}
                </span>
                <button onClick={() => navigate(`/orders/${o.orderId}`)} className="px-3 py-1 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 text-sm">
                  Xem chi tiết
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận hủy đơn"
        message="Bạn có chắc muốn hủy đơn hàng này không?"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={confirmCancel}
      />
    </div>
  );
}