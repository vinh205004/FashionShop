import { useEffect, useState } from 'react';
// 👇 Đổi từ getVouchers sang getAllVouchersAdmin
import { getAllVouchersAdmin, createVoucherAPI, updateVoucherAPI, deleteVoucherAPI, type VoucherAdmin } from '../../services/voucherService';
import { Edit, Trash2, Plus, X, Tag, RefreshCcw } from 'lucide-react'; // Thêm icon RefreshCcw
import { useToast } from '../../contexts/ToastContext';

export default function VoucherManager() {
  const [vouchers, setVouchers] = useState<VoucherAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  // State cho Modal Form
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Form Data
  const [formData, setFormData] = useState({
    id: 0,
    code: '',
    discountType: 'FIXED', 
    discountValue: 0,
    minOrderValue: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    isActive: true
  });

  const fetchVouchers = async () => {
    setLoading(true);
    // Gọi API dành riêng cho Admin để lấy full danh sách
    const data = await getAllVouchersAdmin();
    setVouchers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Mở modal thêm mới
  const handleAddNew = () => {
    setFormData({
        id: 0, code: '', discountType: 'FIXED', discountValue: 0, minOrderValue: 0, 
        startDate: new Date().toISOString().split('T')[0], 
        endDate: '', usageLimit: 100, isActive: true
    });
    setIsEditing(false);
    setShowModal(true);
  };

  // Mở modal sửa
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (v: any) => {
    setFormData({
        id: v.voucherId,
        code: v.code,
        discountType: v.discountType || 'FIXED',
        discountValue: v.discountValue,
        minOrderValue: v.minOrderValue || 0,
        startDate: v.startDate ? v.startDate.split('T')[0] : '',
        endDate: v.endDate ? v.endDate.split('T')[0] : '',
        usageLimit: v.usageLimit || 0,
        isActive: v.isActive
    });
    setIsEditing(true);
    setShowModal(true);
  };

  // Submit Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || formData.discountValue <= 0) {
        addToast("Vui lòng nhập Mã và Giá trị giảm > 0", "error");
        return;
    }

    const payload = { ...formData };
    
    let res;
    if (isEditing) {
        res = await updateVoucherAPI(formData.id, payload);
    } else {
        res = await createVoucherAPI(payload);
    }

    if (res.success) {
        addToast(res.message, "success");
        setShowModal(false);
        fetchVouchers(); 
    } else {
        addToast(res.message, "error");
    }
  };

  // Xóa Voucher
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa voucher này?")) return;
    const res = await deleteVoucherAPI(id);
    if (res.success) {
        addToast("Đã xóa thành công", "success");
        setVouchers(prev => prev.filter(v => v.id !== id)); 
    } else {
        addToast(res.message, "error");
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Tag /> Quản lý Mã Giảm Giá
        </h1>
        <div className="flex gap-2">
            <button onClick={fetchVouchers} className="bg-gray-100 text-gray-600 px-3 py-2 rounded hover:bg-gray-200" title="Tải lại">
                <RefreshCcw size={18} />
            </button>
            <button onClick={handleAddNew} className="bg-black text-white px-4 py-2 rounded flex items-center gap-2 hover:bg-gray-800">
                <Plus size={18} /> Thêm mới
            </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 text-gray-700 uppercase text-xs font-bold">
            <tr>
              <th className="p-4 border-b">Mã Code</th>
              <th className="p-4 border-b">Giảm giá</th>
              <th className="p-4 border-b">Đơn tối thiểu</th>
              <th className="p-4 border-b">Thời hạn</th>
              <th className="p-4 border-b">SL</th>
              <th className="p-4 border-b">Trạng thái</th>
              <th className="p-4 border-b text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : vouchers.length === 0 ? (
                <tr><td colSpan={7} className="p-8 text-center text-gray-500">Chưa có voucher nào.</td></tr>
            ) : (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                vouchers.map((v: any) => (
                <tr key={v.voucherId} className="hover:bg-gray-50 border-b last:border-0 transition">
                    <td className="p-4 font-bold text-blue-600">{v.code}</td>
                    <td className="p-4">
                        {v.discountType === 'PERCENT' 
                            ? <span className="text-orange-600 font-bold">{v.discountValue}%</span> 
                            : <span className="text-green-600 font-bold">{v.discountValue.toLocaleString()} ₫</span>}
                    </td>
                    <td className="p-4 text-gray-600">{v.minOrderValue?.toLocaleString()} ₫</td>
                    <td className="p-4">
                        <div className="text-xs text-gray-500 flex flex-col gap-1">
                            <span>BĐ: {new Date(v.startDate).toLocaleDateString('vi-VN')}</span>
                            <span>KT: {new Date(v.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                    </td>
                    <td className="p-4 font-medium">{v.usageLimit}</td>
                    <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {v.isActive ? 'Active' : 'Locked'}
                        </span>
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                            <button onClick={() => handleEdit(v)} className="p-2 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition"><Edit size={16}/></button>
                            <button onClick={() => handleDelete(v.voucherId)} className="p-2 text-red-600 bg-red-50 rounded hover:bg-red-100 transition"><Trash2 size={16}/></button>
                        </div>
                    </td>
                </tr>
                ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL FORM */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-lg p-6 relative shadow-xl transform transition-all scale-100">
                <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-black"><X size={24}/></button>
                <h2 className="text-xl font-bold mb-4 border-b pb-2">{isEditing ? 'Sửa Voucher' : 'Thêm Voucher Mới'}</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Mã Code (*)</label>
                            <input type="text" required className="w-full border p-2 rounded uppercase focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                                placeholder="VD: SALE50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Loại giảm</label>
                            <select className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.discountType} onChange={e => setFormData({...formData, discountType: e.target.value})}
                            >
                                <option value="FIXED">Trừ tiền (VNĐ)</option>
                                <option value="PERCENT">Theo phần trăm (%)</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Giá trị giảm (*)</label>
                            <input type="number" required min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.discountValue} onChange={e => setFormData({...formData, discountValue: Number(e.target.value)})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Đơn tối thiểu</label>
                            <input type="number" min="0" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.minOrderValue} onChange={e => setFormData({...formData, minOrderValue: Number(e.target.value)})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Ngày bắt đầu</label>
                            <input type="date" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Ngày kết thúc</label>
                            <input type="date" required className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700">Số lượng (Limit)</label>
                            <input type="number" min="1" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                                value={formData.usageLimit} onChange={e => setFormData({...formData, usageLimit: Number(e.target.value)})}
                            />
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="flex items-center cursor-pointer select-none">
                                <input type="checkbox" className="w-5 h-5 accent-black mr-2 cursor-pointer" 
                                    checked={formData.isActive} onChange={e => setFormData({...formData, isActive: e.target.checked})}
                                />
                                <span className="text-sm font-medium text-gray-700">Kích hoạt ngay</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded hover:bg-gray-100 transition">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 font-medium transition">
                            {isEditing ? 'Cập nhật' : 'Tạo mới'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
}