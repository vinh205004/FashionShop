import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginAPI, registerAPI } from '../../services/authService'; 
import { useToast } from '../../contexts/ToastContext';

// 1. SỬA INTERFACE USER: Thêm phone và address để dùng cho Auto-fill
export interface User {
  userId: number;
  fullName: string;
  role: string;
  email: string;
  phone?: string;   
  address?: string; 
  token?: string;   
}

interface AuthContextType {
  user: User | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  login: (data: any) => Promise<boolean>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: (data: any) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const { addToast } = useToast();

  // Load user từ LocalStorage khi F5
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Dữ liệu user lỗi, reset...", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        setUser(null);
      }
    }
  }, []);

  // Hàm Login
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const login = async (loginData: any) => {
    const res = await loginAPI(loginData);
    
    if (res.success) {
      // Dữ liệu trả về từ Backend: { userId, fullName, email, phone, address, token, ... }
      const userData = res.data;

      setUser(userData);

      // Lưu thông tin User (để hiển thị)
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Lưu UserID riêng (để CartService dùng)
      localStorage.setItem("userId", userData.userId.toString());

      // 🔥 QUAN TRỌNG: Lưu Token riêng (để sau này gắn vào Header gọi API bảo mật)
      if (userData.token) {
        localStorage.setItem("token", userData.token);
      }

      return true; 
    } else {
      throw new Error(res.message);
    }
  };

  // Hàm Register
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const register = async (registerData: any) => {
    const res = await registerAPI(registerData);
    if (res.success) {
      return true;
    } else {
      throw new Error(res.message);
    }
  };

  // Hàm Update User (Sau khi sửa profile thành công)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateUser = (newInfo: any) => {
    // Lấy lại token cũ (vì API update profile không trả về token mới)
    const currentToken = localStorage.getItem("token");
    
    // Ghép thông tin mới với token cũ để không bị mất đăng nhập
    const updatedUser = { ...newInfo, token: currentToken }; 
    
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.clear(); // Xóa sạch user, token, cart...
    addToast("Đã đăng xuất", "info");
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateUser, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;