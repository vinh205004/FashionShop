import { Route, Routes } from "react-router-dom";
import { AuthProvider } from "./pages/contexts/AuthContext";

// Import Layouts
import MainLayout from "./layouts/MainLayout"; // Layout cho khách (Mới tạo ở Bước 1)
import AdminLayout from "./pages/Admin/AdminLayout"; // Layout cho Admin

// Import Components bảo vệ
import AdminRoute from "./components/AdminRoute";

// Import Pages
import Home from "./pages/Home/Home";
import CategoryPage from "./pages/CategoryPage";
import Product from "./pages/Product/Product";
import SearchResultPage from "./pages/SearchResultPage";
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";
import OrderTracking from "./pages/OrderTracking/OrderTracking";
import NotFound from "./pages/NotFound";
import UserProfile from "./pages/Auth/UserProfile";
import Dashboard from "./pages/Admin/Dashboard";
import ProductManager from "./pages/Admin/ProductManager";
import OrderManager from "./pages/Admin/OrderManager";
import UserManager from "./pages/Admin/UserManager";
import VoucherManager from "./pages/Admin/VoucherManager";

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ========================================================= */}
        {/* NHÁNH 1: KHÁCH HÀNG (Dùng MainLayout: Có Header/Footer)   */}
        {/* ========================================================= */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orders" element={<OrderTracking />} />
          <Route path="/orders/:id" element={<OrderTracking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/search" element={<SearchResultPage />} />
          
          {/* Các route category động để xuống dưới cùng để tránh conflict */}
          <Route path="/:category/:subcategory" element={<CategoryPage />} />
          <Route path="/:category" element={<CategoryPage />} />
        </Route>


        {/* ========================================================= */}
        {/* NHÁNH 2: ADMIN (Dùng AdminLayout: Sidebar riêng)          */}
        {/* ========================================================= */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="customers" element={<UserManager />} />
            <Route path="vouchers" element={<VoucherManager />} />
          </Route>
        </Route>


        {/* ========================================================= */}
        {/* NHÁNH 3: CÁC TRANG KHÁC (404)                             */}
        {/* ========================================================= */}
        <Route path="*" element={<NotFound />} />
        
      </Routes>
    </AuthProvider>
  );
}

export default App;