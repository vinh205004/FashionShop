import React, { useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "../pages/contexts/AuthContext";

const AuthModal: React.FC = () => {
  const { login, register, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.email || !formData.password) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      setError("Mật khẩu không khớp");
      return;
    }

    if (!isLogin && !formData.name) {
      setError("Vui lòng nhập họ và tên");
      return;
    }

    try {
      if (isLogin) {
        login(formData.email, formData.password);
      } else {
        register(formData.name, formData.email, formData.password);
      }
      // Reset form
      setFormData({ name: "", email: "", password: "", confirmPassword: "" });
    } catch (error) {
      console.error("Auth error:", error);
      setError("Đã có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setFormData({ name: "", email: "", password: "", confirmPassword: "" });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white w-96 rounded-2xl shadow-xl p-6 relative">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={() => setIsAuthModalOpen(false)}
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-semibold mb-6 text-center">
          {isLogin ? "Đăng nhập" : "Đăng ký"}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                placeholder="Nhập họ và tên"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500"
                required
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="Nhập email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mật khẩu
            </label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500"
              required
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Xác nhận mật khẩu
              </label>
              <input
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#3c474c] text-white py-2.5 rounded-lg hover:bg-[#2a3339] transition-colors font-medium"
          >
            {isLogin ? "Đăng nhập" : "Đăng ký"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isLogin ? (
              <>
                Chưa có tài khoản?{" "}
                <button
                  onClick={toggleMode}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản?{" "}
                <button
                  onClick={toggleMode}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </p>
        </div>

        {isLogin && (
          <div className="mt-4 text-center">
            <button className="text-sm text-blue-600 hover:underline">
              Quên mật khẩu?
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;