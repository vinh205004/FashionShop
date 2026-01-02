import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { Outlet } from 'react-router-dom';

const MainLayout = ({ children }: { children?: React.ReactNode }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Header /> {/* Header mua hàng */}
      <Navbar /> {/* Navbar mua hàng */}

      <main className="flex-1">
        {/* Nếu có children truyền vào thì hiện children, không thì hiện Outlet (Route con) */}
        {children || <Outlet />} 
      </main>

      <Footer /> {/* Footer mua hàng */}
    </div>
  );
};

export default MainLayout;