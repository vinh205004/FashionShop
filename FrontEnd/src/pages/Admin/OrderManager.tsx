import { useEffect, useState } from 'react';
import { Eye, CheckCircle, XCircle, Clock, Truck, Ban, PackageCheck } from 'lucide-react';
import { 
  getAllOrdersAdmin, 
  updateOrderStatus, 
  type AdminOrder 
} from '../../services/orderService';
import { useToast } from '../../contexts/ToastContext';

const OrderManager = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await getAllOrdersAdmin();
      setOrders(data);
    } catch (error) {
      console.error(error);
      addToast("Lỗi tải đơn hàng", "error");
    } finally {
      setLoading(false);
    }
  };

  // Admin chỉ làm nhiệm vụ: Duyệt đơn (Pending -> Confirmed)
  // Sau đó việc chuyển sang Shipping/Completed là do App Shipper hoặc Khách hàng làm
  const handleApprove = async (id: number) => {
    if (!window.confirm(`Duyệt đơn hàng #${id} để tìm Shipper?`)) return;
    try {
      // Chuyển sang Confirmed (Nghĩa là Đã duyệt/Sẵn sàng giao)
      await updateOrderStatus(id, 'Confirmed'); 
      addToast(`Đã duyệt đơn #${id}. Đang tìm Shipper...`, "success");
      fetchOrders(); 
    } catch  {
      addToast("Lỗi duyệt đơn", "error");
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm(`Bạn muốn từ chối/hủy đơn hàng #${id}?`)) return;
    try {
      await updateOrderStatus(id, 'Cancelled');
      addToast(`Đã hủy đơn #${id}`, "success");
      fetchOrders(); 
    } catch  {
      addToast("Lỗi hủy đơn", "error");
    }
  };

  // Helper: Chọn màu badge và Text hiển thị theo quy trình Ecosystem
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending': 
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Clock size={14}/> Chờ duyệt</span>;
      
      case 'Confirmed': 
        // Trạng thái này nghĩa là Admin đã duyệt -> Chờ Shipper nhận đơn
        return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><PackageCheck size={14}/> Đã duyệt (Tìm Shipper)</span>;
      
      case 'Shipping': 
        return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Truck size={14}/> Shipper đang giao</span>;
      
      case 'Completed': 
        return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><CheckCircle size={14}/> Hoàn thành</span>;
      
      case 'Cancelled': 
        return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold flex items-center gap-1 w-fit"><Ban size={14}/> Đã hủy</span>;
      
      default: 
        return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800">Quản lý vận đơn</h2>
        <p className="text-sm text-gray-500">Hệ sinh thái: Admin duyệt - Shipper giao - Khách nhận</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
           <div className="p-10 text-center text-gray-500">Đang tải dữ liệu...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="p-4 text-sm font-semibold text-gray-600">Mã đơn</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Khách hàng</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Thanh toán</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Tổng tiền</th>
                  <th className="p-4 text-sm font-semibold text-gray-600">Trạng thái</th>
                  <th className="p-4 text-sm font-semibold text-gray-600 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.orderId} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-blue-600">#{order.orderId}</td>
                    <td className="p-4">
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                        <div className="text-[10px] text-gray-400 mt-1">
                            {new Date(order.orderDate).toLocaleDateString('vi-VN')}
                        </div>
                    </td>
                    <td className="p-4 text-sm">
                        <div className="font-medium">{order.paymentMethod}</div>
                        <div className={`text-xs font-semibold ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-orange-500'}`}>
                            {order.paymentStatus === 'Paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </div>
                    </td>
                    <td className="p-4 font-bold text-gray-800">
                        {order.totalAmount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td className="p-4">{getStatusBadge(order.orderStatus)}</td>
                    
                    <td className="p-4 flex justify-end gap-2">
                      {/* CHỈ HIỆN NÚT KHI ĐANG CHỜ DUYỆT */}
                      {order.orderStatus === 'Pending' && (
                        <>
                            <button 
                                onClick={() => handleApprove(order.orderId)}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm flex items-center gap-1 shadow-sm" 
                                title="Duyệt đơn để tìm Shipper"
                            >
                                <CheckCircle size={16} /> Duyệt
                            </button>
                            <button 
                                onClick={() => handleReject(order.orderId)}
                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-50 transition text-sm flex items-center gap-1" 
                                title="Từ chối đơn hàng"
                            >
                                <XCircle size={16} /> Hủy
                            </button>
                        </>
                      )}
                      
                      {/* Nếu đã duyệt (Confirmed) thì hiện thông báo chờ Shipper */}
                      {order.orderStatus === 'Confirmed' && (
                          <span className="text-xs text-blue-500 italic py-2">Đang tìm Shipper...</span>
                      )}

                      <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition" title="Xem chi tiết">
                        <Eye size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {orders.length === 0 && (
                <div className="p-10 text-center text-gray-400">Chưa có đơn hàng nào</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManager;