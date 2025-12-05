import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate, Link } from "react-router-dom";

const Register: React.FC = () => {
  const { register } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: "",
    fullName: "", // Mới thêm
    email: "",
    phone: "",    // Mới thêm
    password: "",
    confirmPassword: ""
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu nhập lại không khớp!");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Gọi hàm register từ Context
      await register({
        username: formData.username,
        password: formData.password,
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone
      });

      addToast("Đăng ký thành công! Vui lòng đăng nhập.", 'success');
      navigate("/login"); 
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Đăng ký thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-[80vh] py-10">
      <form onSubmit={handleSubmit} className="w-[400px] bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng ký tài khoản</h2>

        {error && <div className="bg-red-50 text-red-500 text-sm p-2 mb-3 rounded">{error}</div>}

        <input
          name="username"
          type="text"
          placeholder="Tên đăng nhập *"
          required
          value={formData.username}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          name="fullName"
          type="text"
          placeholder="Họ và tên đầy đủ *"
          required
          value={formData.fullName}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          name="email"
          type="email"
          placeholder="Email *"
          required
          value={formData.email}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          name="phone"
          type="tel"
          placeholder="Số điện thoại *"
          required
          value={formData.phone}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          name="password"
          type="password"
          placeholder="Mật khẩu *"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full border p-2 mb-3 rounded"
        />

        <input
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu *"
          required
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full border p-2 mb-4 rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#274151] text-white py-2 rounded hover:bg-[#1c2e38] disabled:opacity-70"
        >
          {loading ? "Đang xử lý..." : "Đăng ký"}
        </button>

        <div className="mt-4 text-center text-sm">
          Đã có tài khoản? <Link to="/login" className="text-blue-600 hover:underline">Đăng nhập</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;