import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../../contexts/ToastContext";
import { useNavigate, Link } from "react-router-dom"; // Thêm useNavigate

const Login: React.FC = () => {
  const { login } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate(); // Hook chuyển trang

  const [username, setUsername] = useState(""); // Đổi tên biến cho khớp logic Backend
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Gửi object đúng format { Username, Password }
      await login({ username: username, password: password });
      
      addToast("Đăng nhập thành công!", 'success');
      navigate("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-[70vh]">
      <form onSubmit={handleSubmit} className="w-[350px] bg-white p-6 rounded-lg shadow-md border">
        <h2 className="text-2xl font-bold mb-4 text-center">Đăng nhập</h2>

        {error && <div className="bg-red-50 text-red-500 text-sm p-2 mb-3 rounded">{error}</div>}

        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập</label>
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#274151] text-white py-2 rounded hover:bg-[#1c2e38] disabled:opacity-70"
        >
          {loading ? "Đang xử lý..." : "Đăng nhập"}
        </button>
        
        <div className="mt-4 text-center text-sm">
          Chưa có tài khoản? <Link to="/register" className="text-blue-600 hover:underline">Đăng ký ngay</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;