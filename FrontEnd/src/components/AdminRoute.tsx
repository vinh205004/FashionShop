import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../pages/contexts/AuthContext";

const AdminRoute = () => {
  const { user } = useAuth();

  // 1. Kiểm tra đăng nhập
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Ép kiểu 'any' để bỏ qua kiểm tra TypeScript tạm thời
  // Giúp chúng ta lấy được dữ liệu dù nó tên là 'role' hay 'Role'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentUser = user as any;

  // 3. Lấy role bất chấp tên biến (Ưu tiên role -> Role -> rỗng)
  const roleValue = currentUser.role || currentUser.Role || "";

  // Debug: In ra xem nó đang nhận được cái gì
  console.log("DEBUG ADMIN ROUTE:", {
    roleTimThay: roleValue,
    roleGoc: currentUser
  });

  // 4. So sánh (Chuyển về chữ thường để so sánh cho chắc)
  if (roleValue.toString().toLowerCase() !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 5. Hợp lệ -> Cho vào
  return <Outlet />;
};

export default AdminRoute;