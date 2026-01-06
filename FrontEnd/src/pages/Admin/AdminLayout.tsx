import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  LogOut, 
  Menu,
  Bell,
  Tag
} from 'lucide-react';

const AdminLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Tổng quan', exact: true },
    { path: '/admin/products', icon: <Package size={20} />, label: 'Sản phẩm' },
    { path: '/admin/orders', icon: <ShoppingCart size={20} />, label: 'Đơn hàng' },
    { path: '/admin/customers', icon: <Users size={20} />, label: 'Khách hàng' },
    { path: '/admin/vouchers', icon: <Tag size={20} />, label: 'Mã giảm giá' }, 
  ];

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* 1. SIDEBAR (Fixed Left) */}
      <aside className="w-64 bg-[#1e293b] text-white flex flex-col fixed h-full shadow-xl z-20">
        {/* Logo Area */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700 bg-[#0f172a]">
          <h1 className="text-xl font-bold tracking-wider text-blue-400">ADMIN PAGE</h1>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            // Logic kiểm tra Active
            const isActive = item.exact 
                ? location.pathname === item.path
                : location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-blue-600 text-white shadow-md translate-x-1' 
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <div className={`${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>
                  {item.icon}
                </div>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-gray-700 bg-[#0f172a]">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-lg font-bold">
              {user?.fullName?.charAt(0).toUpperCase() || "A"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-white">{user?.fullName}</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full py-2 bg-red-500/10 text-red-400 hover:bg-red-600 hover:text-white rounded transition-colors text-sm font-medium"
          >
            <LogOut size={16} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER (Right Side) */}
      <div className="flex-1 flex flex-col ml-64">
        
        {/* Top Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 text-gray-500">
            <Menu size={24} className="cursor-pointer hover:text-black" />
            <span className="text-sm">Hôm nay: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
          <div className="flex items-center gap-6">
            <button className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <Bell size={20} className="text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 p-8 overflow-y-auto bg-gray-50">
          <Outlet /> 
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;