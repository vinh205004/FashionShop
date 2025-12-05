import React, { useRef, useState } from "react";
import Slider from "react-slick";
import { ShoppingBag, User, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
// Import Contexts
import { useAuth } from "../pages/contexts/AuthContext";
import { useCart } from "../contexts/CartContext";

// Import ảnh logo (Giữ nguyên cách import của bạn)
import logo from "../assets/logo.PNG";

import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Header: React.FC = () => {
  const sliderRef = useRef<Slider | null>(null);
  const navigate = useNavigate();
  
  // Lấy data từ Context
  const { user, logout } = useAuth();
  const { items } = useCart();
  
  // Tính tổng số lượng sản phẩm trong giỏ
  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // State cho menu dropdown user
  const [showUserMenu, setShowUserMenu] = useState(false);

  const messages = [
    "ĐỔI HÀNG MIỄN PHÍ - TẠI TẤT CẢ CỬA HÀNG TRONG 30 NGÀY",
    "THÊM VÀO GIỎ 300.000 ₫ ĐỂ MIỄN PHÍ VẬN CHUYỂN",
    "ƯU ĐÃI LÊN ĐẾN 50% CHO THÀNH VIÊN MỚI 🎉",
  ];

  const settings = {
    autoplay: true,
    autoplaySpeed: 3000,
    infinite: true,
    arrows: false,
    dots: false,
    speed: 700,
    slidesToShow: 1,
    slidesToScroll: 1,
    pauseOnHover: false,
    swipe: false,
    fade: false,
    cssEase: "ease-in-out",
  };

  const handleUserClick = () => {
    if (user) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="w-full bg-white shadow-sm sticky top-0 z-50">
      {/* Thanh chạy chữ Carousel */}
      <div className="relative w-full bg-[#f5f7fa] border-b overflow-hidden h-10">
        <div className="max-w-3xl mx-auto relative h-full flex items-center">
           <button
            onClick={() => sliderRef.current?.slickPrev()}
            className="absolute left-0 z-10 text-gray-400 hover:text-black p-1"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex-1 overflow-hidden px-8">
            <Slider ref={sliderRef} {...settings}>
              {messages.map((msg, index) => (
                <div key={index} className="text-center">
                  <p className="text-xs md:text-sm font-medium text-[#3c474c] truncate cursor-default">
                    {msg}
                  </p>
                </div>
              ))}
            </Slider>
          </div>

          <button
            onClick={() => sliderRef.current?.slickNext()}
            className="absolute right-0 z-10 text-gray-400 hover:text-black p-1"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Header chính */}
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 px-4 md:px-6">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0">
          <img src={logo} alt="Canifa" className="w-24 md:w-32 cursor-pointer object-contain" />
        </Link>

        {/* Ô tìm kiếm */}
        <div className="flex-1 mx-4 md:mx-10 max-w-2xl">
          <SearchBar />
        </div>

        {/* Các icon */}
        <div className="flex items-center gap-4 md:gap-6 text-sm font-medium text-gray-700">
          


          {/* Tài khoản (Có Dropdown) */}
          <div 
            className="relative flex flex-col items-center cursor-pointer hover:text-black transition group"
            onMouseEnter={() => user && setShowUserMenu(true)}
            onMouseLeave={() => setShowUserMenu(false)}
            onClick={handleUserClick}
          >
            <User size={24} strokeWidth={1.5} />
            <span className="text-xs mt-1 max-w-[80px] truncate">
              {user ? user.fullName : "Tài khoản"}
            </span>

            {/* Dropdown Menu khi đã đăng nhập */}
            {user && showUserMenu && (
              <div className="absolute top-full right-0 mt-0 pt-2 w-48 animate-fade-in">
                <div className="bg-white rounded-lg shadow-lg border border-gray-100 overflow-hidden py-1">
                  <div className="px-4 py-2 border-b border-gray-100 bg-gray-50">
                    <p className="text-xs text-gray-500">Xin chào,</p>
                    <p className="font-bold text-gray-900 truncate">{user.fullName}</p>
                  </div>
                  

                  
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 text-left"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Giỏ hàng */}
          <Link to="/cart" className="flex flex-col items-center cursor-pointer hover:text-black transition relative">
            <ShoppingBag size={24} strokeWidth={1.5} />
            <span className="text-xs mt-1">Giỏ hàng</span>
            
            {/* Badge số lượng */}
            {cartCount > 0 && (
              <span className="absolute -top-1 right-2 bg-red-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>

        </div>
      </div>
    </header>
  );
};

export default Header;