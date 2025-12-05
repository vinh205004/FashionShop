import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";
import { useNavigate } from "react-router-dom";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Service
import { getVouchers } from "../../services/voucherService";
import type { Voucher } from "../../services/voucherService";
import { getNewProducts, getRandomProductsByCategory } from "../../services/mockProducts";
import type { ProductMock } from "../../services/mockProducts";
import ProductCard from "../../components/ProductCard";
import { useToast } from "../../contexts/ToastContext";
import { useCart } from "../../contexts/CartContext";

const banner1 = "/banners/banner1.webp";
const banner2 = "/banners/banner2.webp";
const banner3 = "/banners/banner3.webp";
const banner4 = "/banners/banner4.webp";
const banner5 = "/banners/banner5.webp";

const Home: React.FC = () => {
  const slides = [banner1, banner2, banner3, banner4, banner5];
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { addItem } = useCart();
  
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [products, setProducts] = useState<ProductMock[]>([]);
  const [filter, setFilter] = useState<string>("Tất cả");

  // Load Voucher
  useEffect(() => {
    let mounted = true;
    getVouchers().then((data) => {
      if (mounted) setVouchers(data);
    });
    return () => { mounted = false; };
  }, []);

  // Load Sản phẩm
  useEffect(() => {
    let mounted = true;
    
    const loadProducts = async () => {
      try {
        let data: ProductMock[] = [];
        if (filter === "Tất cả") {
          data = await getNewProducts();
        } else {
          // Map tên filter sang code backend
          let categoryCode = "";
          switch(filter) {
            case "NỮ": categoryCode = "nu"; break;
            case "NAM": categoryCode = "nam"; break;
            case "BÉ GÁI": categoryCode = "be-gai"; break;
            case "BÉ TRAI": categoryCode = "be-trai"; break;
            default: categoryCode = "";
          }
          if (categoryCode) {
            data = await getRandomProductsByCategory(categoryCode, 8);
          }
        }
        if (mounted) setProducts(data);
      } catch (error) {
        console.error("Error loading products:", error);
      }
    };
    
    loadProducts();
    
    return () => { mounted = false; };
  }, [filter]);

  const handleAddToCart = (product: ProductMock) => {
     addItem(product);
     addToast(`Đã thêm "${product.title}" vào giỏ hàng`, 'success');
  };

  return (
    <div className="w-full">
      {/* Banner Slider */}
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="w-full h-[300px] md:h-[505px]"
      >
        {slides.map((img, index) => (
          <SwiperSlide key={index}>
            <img
              src={img}
              alt={`slide-${index}`}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback nếu quên copy ảnh
                e.currentTarget.src = "https://via.placeholder.com/1920x600?text=Banner+Not+Found";
              }}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* === ƯU ĐÃI NỔI BẬT === */}
      {vouchers.length > 0 && (
        <section className="max-w-7xl mx-auto my-10 px-6">
          <h2 className="text-3xl font-extrabold text-[#274151] mb-6 text-center">
            ƯU ĐÃI NỔI BẬT
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center">
            {vouchers.map((v) => (
              <div key={v.id} className="w-full max-w-xl border rounded-md p-6 bg-white shadow-sm hover:shadow-md transition">
                <h3 className="text-xl font-bold mb-2">{v.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{v.description}</p>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <div>Mã: <strong>{v.code}</strong></div>
                    <div>HSD: {new Date(v.expiredAt).toLocaleDateString('vi-VN')}</div>
                  </div>
                  <button 
                    onClick={() => {
                        navigator.clipboard.writeText(v.code);
                        addToast("Đã copy mã voucher", "success");
                    }}
                    className="bg-[#3c474c] text-white px-4 py-2 rounded hover:bg-[#2c3539]"
                  >
                    Copy Mã
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* === SẢN PHẨM MỚI === */}
      <section className="max-w-7xl mx-auto my-12 px-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-extrabold text-[#274151]">SẢN PHẨM MỚI</h2>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <button 
              onClick={() => navigate('/search')}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              XEM THÊM →
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {['Tất cả','NỮ','NAM','BÉ GÁI','BÉ TRAI'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 border rounded-full text-sm whitespace-nowrap ${filter===f ? 'bg-[#374151] text-white' : 'hover:bg-gray-50'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="relative group">
          {/* Custom Navigation */}
          <button className="custom-prev absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 rounded-full shadow flex items-center justify-center border opacity-0 group-hover:opacity-100 transition-opacity -ml-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <button className="custom-next absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 rounded-full shadow flex items-center justify-center border opacity-0 group-hover:opacity-100 transition-opacity -mr-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
          </button>

          <Swiper
            modules={[Navigation]}
            navigation={{ nextEl: '.custom-next', prevEl: '.custom-prev' }}
            spaceBetween={20}
            slidesPerView={4}
            breakpoints={{
              320: { slidesPerView: 1.5 },
              640: { slidesPerView: 2.5 },
              1024: { slidesPerView: 3.5 },
              1280: { slidesPerView: 4 },
            }}
            className="py-4 px-1"
          >
            {products.map((p) => (
                <SwiperSlide key={p.id}>
                  <ProductCard
                    product={p}
                    title={p.title}
                    price={p.price}
                    images={p.images}
                    badges={p.badges}
                    onCardClick={() => navigate(`/product/${p.id}`)}
                    onAddToCart={() => handleAddToCart(p)}
                  />
                </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </div>
  );
};

export default Home;