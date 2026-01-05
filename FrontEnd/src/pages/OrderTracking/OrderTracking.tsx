import { useEffect, useState, useCallback } from 'react';
import { getMyOrders, getOrderDetail, updateOrderStatus, type OrderDTO } from '../../services/orderService'; 
import { useNavigate, useParams } from 'react-router-dom';
import ConfirmModal from '../../components/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';
import { createPaymentAPI, confirmPaymentAPI } from '../../services/paymentService';
import { Clock, CheckCircle, Truck, XCircle, Package } from 'lucide-react';

export default function OrderTracking() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [detailOrder, setDetailOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetOrderId, setTargetOrderId] = useState<number | null>(null); 
  
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Helper: Load chi tiết đơn (Tách ra để tái sử dụng khi reload)
  const fetchDetail = useCallback(async (orderId: number) => {
    setLoading(true);
    const data = await getOrderDetail(orderId);
    if (data) {
      setDetailOrder(data);
    } else {
      addToast("Không tìm thấy đơn hàng", "error");
      navigate('/orders');
    }
    setLoading(false);
  }, [addToast, navigate]);

  // Helper: Load danh sách
  const fetchList = useCallback(async () => {
    setLoading(true);
    const data = await getMyOrders();
    setOrders(data);
    setLoading(false);
  }, []);

  // Effect chính
  useEffect(() => {
    if (id) {
      fetchDetail(parseInt(id));
    } else {
      fetchList();
    }
  }, [id, fetchDetail, fetchList]);

  // Xử lý Hủy đơn
  const handleCancel = (orderId: number) => {
    setTargetOrderId(orderId);
    setConfirmOpen(true);
  };

  const confirmCancel = async () => {
    if (!targetOrderId) return;
    try {
      // Gọi API update status thành Cancelled
      await updateOrderStatus(targetOrderId, 'Cancelled'); 
      addToast("Đã hủy đơn hàng thành công", "success");
      
      // Refresh dữ liệu mà KHÔNG cần reload trang
      if (id) fetchDetail(parseInt(id));
      else fetchList();
      
    } catch  {
      addToast("Lỗi khi hủy đơn hàng", "error");
    } finally {
      setConfirmOpen(false);
    }
  };

  // Xử lý Thanh toán lại
  const handlePayment = async (order: OrderDTO) => {
    if (!order) return;
    addToast("Đang kết nối cổng thanh toán...", "info");
    
    // 1. Tạo giao dịch
    const res = await createPaymentAPI(order.orderId, order.totalAmount, order.paymentMethod);
    
    if (res.success && res.paymentId) {
      addToast("Đang xử lý giao dịch...", "info");
      
      // 2. Giả lập check thanh toán
      setTimeout(async () => {
        const confirmRes = await confirmPaymentAPI(res.paymentId!);
        if (confirmRes.success) {
          addToast("Thanh toán thành công!", "success");
          // Refresh data
          fetchDetail(order.orderId); 
        } else {
          addToast("Thanh toán thất bại", "error");
        }
      }, 2000);
      
    } else {
      addToast(res.message || "Lỗi tạo thanh toán", "error");
    }
  };

  // Helper hiển thị trạng thái đẹp hơn (Đồng bộ với Admin)
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': 
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={14}/> Chờ xác nhận</span>;
      case 'Confirmed': 
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Package size={14}/> Đã xác nhận</span>;
      case 'Shipping': 
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={14}/> Đang giao hàng</span>;
      case 'Completed': 
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={14}/> Hoàn thành</span>;
      case 'Cancelled': 
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><XCircle size={14}/> Đã hủy</span>;
      default: 
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  if (loading) return <div className="max-w-4xl mx-auto my-10 px-6 text-center text-gray-500">Đang tải dữ liệu...</div>;

  // --- VIEW CHI TIẾT ---
  if (id && detailOrder) {
    return (
      <div className="max-w-4xl mx-auto my-10 px-6">
        <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            Chi tiết đơn hàng #{detailOrder.orderId}
        </h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          {/* Header Info */}
          <div className="flex justify-between items-start border-b pb-4 mb-4">
             <div>
                <p className="text-gray-500 text-sm">Ngày đặt hàng</p>
                <p className="font-semibold">{new Date(detailOrder.orderDate).toLocaleString('vi-VN')}</p>
             </div>
             <div className="text-right">
                <p className="text-gray-500 text-sm mb-1">Trạng thái đơn hàng</p>
                {getStatusBadge(detailOrder.orderStatus)}
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Địa chỉ nhận hàng</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                  <p className="font-bold text-gray-900">{detailOrder.receiverName}</p>
                  <p className="text-gray-600">{detailOrder.receiverPhone}</p>
                  <p className="text-gray-600">{detailOrder.shippingAddress}</p>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-gray-800 mb-2">Thanh toán</h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-1">
                  <p className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="font-semibold">{detailOrder.paymentMethod}</span>
                  </p>
                  <p className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className={`font-bold ${detailOrder.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                          {detailOrder.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                      </span>
                  </p>
              </div>
            </div>
          </div>

          {/* Danh sách sản phẩm */}
          <div className="space-y-4">
            <h3 className="font-bold text-gray-800">Sản phẩm</h3>
            {detailOrder.orderDetails.map((item, index) => (
              <div key={index} className="flex gap-4 items-center">
                <img src={item.productImage || "https://via.placeholder.com/80"} className="w-16 h-16 object-cover rounded-lg border" alt={item.productName}/>
                <div className="flex-1">
                  <div className="font-semibold text-gray-800">{item.productName}</div>
                  <div className="text-sm text-gray-500">Phân loại: {item.size}</div>
                  <div className="text-sm text-gray-500">x {item.quantity}</div>
                </div>
                <div className="font-bold text-gray-900">{item.totalPrice.toLocaleString('vi-VN')} ₫</div>
              </div>
            ))}
          </div>

          {/* Tổng tiền */}
          <div className="mt-6 pt-4 border-t">
            <div className="flex justify-between mb-2 text-sm">
              <span className="text-gray-600">Phí vận chuyển</span>
              <span>{detailOrder.shippingFee.toLocaleString('vi-VN')} ₫</span>
            </div>
            {detailOrder.discountAmount > 0 && (
              <div className="flex justify-between mb-2 text-sm text-green-600">
                <span>Giảm giá</span>
                <span>-{detailOrder.discountAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 mt-2 border-t border-dashed">
              <span className="font-bold text-lg">Tổng cộng</span>
              <span className="font-bold text-xl text-red-600">{detailOrder.totalAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
          </div>

          {/* Nút Thanh toán (Chỉ hiện khi CHƯA THANH TOÁN + KHÔNG PHẢI COD + KHÔNG BỊ HỦY) */}
          {detailOrder.paymentStatus === 'Unpaid' && 
           detailOrder.paymentMethod.toUpperCase() !== 'COD' && // 🔥 Fix: Thêm toUpperCase() để so sánh chuẩn
           detailOrder.orderStatus !== 'Cancelled' && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-blue-800 mb-3 text-sm flex items-center gap-2">
                <span>⚠️</span> Đơn hàng chưa được thanh toán. Vui lòng thanh toán để chúng tôi xử lý đơn hàng.
                </p>
                <button 
                onClick={() => handlePayment(detailOrder)}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow-sm"
                >
                THANH TOÁN NGAY ({detailOrder.totalAmount.toLocaleString('vi-VN')} ₫)
                </button>
            </div>
          )}

          {/* Nút Thao tác */}
          <div className="mt-8 flex gap-3 pt-4 border-t">
            <button onClick={() => navigate('/orders')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition">
                Quay lại
            </button>
            
            {/* Chỉ cho phép Hủy khi đơn là Pending */}
            {detailOrder.orderStatus === 'Pending' && (
              <button 
                onClick={() => handleCancel(detailOrder.orderId)} 
                className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition ml-auto"
              >
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
        
        {/* Modal xác nhận hủy */}
        <ConfirmModal
            open={confirmOpen}
            title="Xác nhận hủy đơn"
            message="Bạn có chắc chắn muốn hủy đơn hàng này? Hành động này không thể hoàn tác."
            onCancel={() => setConfirmOpen(false)}
            onConfirm={confirmCancel}
        />
      </div>
    );
  }

  // --- VIEW DANH SÁCH ---
  return (
    <div className="max-w-4xl mx-auto my-10 px-6">
      <h1 className="text-2xl font-bold mb-6">Lịch sử đơn hàng</h1>
      
      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-6 text-lg">Bạn chưa có đơn hàng nào.</p>
          <button onClick={() => navigate('/')} className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium">
            Mua sắm ngay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(o => (
            <div key={o.orderId} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/orders/${o.orderId}`)}>
              <div>
                <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-lg text-gray-800">#{o.orderId}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{new Date(o.orderDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="text-sm font-semibold text-gray-900">
                    {o.totalAmount.toLocaleString('vi-VN')} ₫ 
                    <span className="text-gray-400 font-normal mx-2">|</span> 
                    <span className="text-gray-500 font-normal">{o.paymentMethod}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto border-t md:border-t-0 pt-3 md:pt-0">
                {getStatusBadge(o.orderStatus)}
                <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  Chi tiết &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}