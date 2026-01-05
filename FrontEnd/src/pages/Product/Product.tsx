import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getProductById } from "../../services/mockProducts";
import type { ProductMock } from "../../services/mockProducts";
import { Share2, ChevronDown, ChevronUp } from "lucide-react";
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';

const Product: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductMock | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  
  // 👇 SỬA 1: Dùng addToCart thay vì addItem
  const { addToCart } = useCart();
  const { addToast } = useToast();
  
  // trạng thái accordion
  const [descriptionOpen, setDescriptionOpen] = useState(true);
  const [materialOpen, setMaterialOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await getProductById(Number(id)); 
        
        if (!data) {
          setError("Không tìm thấy sản phẩm");
        } else {
          setProduct(data);
          // Tự động chọn size đầu tiên (nếu có)
          if (data.sizes && data.sizes.length > 0) {
            setSelectedSize(data.sizes[0]);
          }
        }
      } catch (err) {
        console.error("Error loading product:", err);
        setError("Không thể tải thông tin sản phẩm");
      } finally {
        setIsLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleAddToCart = () => {
    // 1. Validate Size
    if (product?.sizes && product.sizes.length > 0 && !selectedSize) {
        addToast("Vui lòng chọn kích cỡ", 'error');
        return;
    }
    
    if (product) {
      // 2. Tạo object sản phẩm kèm size đã chọn
      // (ProductMock đã được thêm trường selectedSize ở bước trước nên không lỗi)
      const productToSend = { 
        ...product, 
        selectedSize: selectedSize 
      };

      // 3. Gọi hàm từ Context
      addToCart(productToSend, quantity);
      
      addToast(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`, 'success');
    }
  };

  const handleCopyCode = () => {
    if (product) {
      navigator.clipboard.writeText(`SKU-${product.id}`);
      addToast("Đã copy mã sản phẩm!", 'success');
    }
  };

  // trạng thái loading
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="flex gap-8 animate-pulse">
          <div className="w-2/3 bg-gray-200 h-[600px] rounded"></div>
          <div className="flex-1 space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-1/3"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Có lỗi xảy ra</h3>
          <p className="text-red-600 mb-4">{error || "Không tìm thấy sản phẩm"}</p>
          <button 
            onClick={() => navigate(-1)}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        {/* vùng bên trái - ảnh */}
        <div className="w-2/3 flex gap-4">
          {/* cột ảnh thu nhỏ */}
          <div className="flex flex-col gap-2 w-24">
            {product.images.map((img, index) => (
              <div
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`cursor-pointer border-2 rounded overflow-hidden transition-all ${
                  selectedImage === index ? 'border-gray-800' : 'border-gray-200 hover:border-gray-400'
                }`}
              >
                <img 
                  src={img} 
                  alt={`${product.title} ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
              </div>
            ))}
          </div>

          {/* Main image */}
          <div className="flex-1 relative bg-gray-100 rounded overflow-hidden">
            <img 
              src={product.images[selectedImage]} 
              alt={product.title}
              className="w-full h-full object-contain"
            />
            <div className="absolute bottom-4 right-4 bg-white px-3 py-1 rounded text-sm font-medium">
              {selectedImage + 1} / {product.images.length}
            </div>
          </div>
        </div>

        {/* vùng bên phải - thông tin sản phẩm */}
        <div className="flex-1">
          {/* tiêu đề và SKU */}
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{product.title}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <span>SKU: SKU-{product.id}</span>
            <button 
              onClick={handleCopyCode}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <Share2 size={14} />
              Copy
            </button>
          </div>

          {/* giá */}
          <div className="text-3xl font-bold text-gray-900 mb-6">
            {product.price.toLocaleString('vi-VN')} ₫
          </div>

          {/* màu sắc - dữ liệu mock */}
          <div className="mb-6">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Màu sắc: <span className="text-gray-900">Tím hoa tiết FP072</span>
            </div>
            <div className="flex gap-2">
              <div className="w-16 h-20 border-2 border-gray-800 rounded overflow-hidden cursor-pointer">
                <img src={product.images[0]} alt="Color 1" className="w-full h-full object-cover" />
              </div>
              <div className="w-16 h-20 border-2 border-gray-200 rounded overflow-hidden cursor-pointer hover:border-gray-400">
                <img src={product.images[0]} alt="Color 2" className="w-full h-full object-cover opacity-50" />
              </div>
              <div className="w-16 h-20 border-2 border-gray-200 rounded overflow-hidden cursor-pointer hover:border-gray-400">
                <img src={product.images[0]} alt="Color 3" className="w-full h-full object-cover opacity-50" />
              </div>
            </div>
          </div>

          {/* chọn kích cỡ */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Kích cỡ:</span>
              <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Share2 size={14} />
                Gợi ý tìm kích cỡ
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.sizes?.map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`px-4 py-3 text-sm border rounded transition-colors ${
                    selectedSize === size
                      ? 'bg-gray-800 text-white border-gray-800'
                      : 'bg-white text-gray-800 border-gray-300 hover:border-gray-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* chọn số lượng */}
          <div className="mb-6">
            <span className="text-sm font-medium text-gray-700 block mb-2">Số lượng:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-100"
              >
                -
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-16 h-10 text-center border border-gray-300 rounded"
              />
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 border border-gray-300 rounded hover:bg-gray-100"
              >
                +
              </button>
            </div>
          </div>

          {/* nút hành động */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={handleAddToCart}
              className="flex-1 bg-red-600 text-white py-3 rounded font-medium hover:bg-red-700 transition-colors"
            >
              THÊM VÀO GIỎ HÀNG
            </button>
            <button className="flex-1 bg-white text-gray-800 py-3 rounded font-medium border-2 border-gray-800 hover:bg-gray-800 hover:text-white transition-colors">
              TÌM TẠI CỬA HÀNG
            </button>
          </div>

          {/* accordions */}
          <div className="border-t border-gray-200">
            {/* mô tả */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => setDescriptionOpen(!descriptionOpen)}
                className="w-full flex items-center justify-between py-4 text-left font-medium text-gray-800"
              >
                Mô tả
                {descriptionOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {descriptionOpen && (
                <div className="pb-4 text-sm text-gray-600">
                  {product.description || "Sản phẩm này chưa có mô tả chi tiết."}
                </div>
              )}
            </div>

            {/* chất liệu */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => setMaterialOpen(!materialOpen)}
                className="w-full flex items-center justify-between py-4 text-left font-medium text-gray-800"
              >
                Chất liệu
                {materialOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {materialOpen && (
                <div className="pb-4 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Chất liệu: Cotton 100%</li>
                    <li>Co giãn tốt, thoáng mát</li>
                    <li>Thấm hút mồ hôi tốt</li>
                    <li>Không nhăn, không phai màu</li>
                  </ul>
                </div>
              )}
            </div>

              {/* hướng dẫn sử dụng */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => setGuideOpen(!guideOpen)}
                className="w-full flex items-center justify-between py-4 text-left font-medium text-gray-800"
              >
                Hướng dẫn sử dụng
                {guideOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
              {guideOpen && (
                <div className="pb-4 text-sm text-gray-600">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Giặt máy ở nhiệt độ thường</li>
                    <li>Không sử dụng chất tẩy</li>
                    <li>Phơi nơi thoáng mát, tránh ánh nắng trực tiếp</li>
                    <li>Ủi ở nhiệt độ thấp</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Benefits */}
          <div className="mt-6 space-y-3">
            <div className="flex items-start gap-3 text-sm">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-800">Thanh toán khi nhận hàng (COD)</div>
                <div className="text-gray-600">Giao hàng toàn quốc.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-800">Miễn phí giao hàng</div>
                <div className="text-gray-600">Với đơn hàng trên 599.000 ₫.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <div className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
              <div>
                <div className="font-medium text-gray-800">Đổi hàng miễn phí</div>
                <div className="text-gray-600">Trong 30 ngày kể từ ngày mua.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Product;