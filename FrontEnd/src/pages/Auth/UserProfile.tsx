import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { updateProfileAPI } from "../../services/authService";
import { User, MapPin, Phone, Mail, Package, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

const UserProfile: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    address: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill dữ liệu cũ
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || "",
        phoneNumber: user.phone || "", 
        address: user.address || "",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const res = await updateProfileAPI(user.userId, formData);
      if (res.success) {
        updateUser(res.data); // Cập nhật Context & LocalStorage
        addToast("Cập nhật thông tin thành công!", "success");
      } else {
        addToast(res.message, "error");
      }
    } catch {
      addToast("Có lỗi xảy ra", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-10 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* SIDEBAR MENU */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow p-6 mb-6 text-center border border-gray-100">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto flex items-center justify-center text-gray-500 mb-3">
              <User size={40} />
            </div>
            <h3 className="font-bold text-lg">{user?.fullName}</h3>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-100">
            <button className="w-full flex items-center gap-3 px-6 py-4 bg-blue-50 text-blue-700 font-medium border-l-4 border-blue-600">
              <User size={18} /> Thông tin tài khoản
            </button>
            <button 
              onClick={() => navigate('/orders')}
              className="w-full flex items-center gap-3 px-6 py-4 text-gray-600 hover:bg-gray-50 transition-colors border-l-4 border-transparent"
            >
              <Package size={18} /> Quản lý đơn hàng
            </button>
            <button 
              onClick={() => { logout(); navigate('/'); }}
              className="w-full flex items-center gap-3 px-6 py-4 text-red-600 hover:bg-red-50 transition-colors border-t"
            >
              <LogOut size={18} /> Đăng xuất
            </button>
          </div>
        </div>

        {/* MAIN FORM */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-8 border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Hồ sơ của tôi</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="w-full pl-10 px-3 py-2 bg-gray-50 border border-gray-300 rounded text-gray-500 cursor-not-allowed"
                  />
                  <span className="absolute right-3 top-2 text-xs text-gray-400">(Không thể thay đổi)</span>
                </div>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Nhập họ tên của bạn"
                  />
                </div>
              </div>

              {/* Số điện thoại */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full pl-10 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                    placeholder="Số nhà, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800 transition-colors disabled:opacity-70 font-medium"
                >
                  {isSubmitting ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;