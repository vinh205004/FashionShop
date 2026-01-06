import React from 'react';
import { useCart } from '../contexts/CartContext';
import type { ProductMock } from '../services/mockProducts';
import { useToast } from '../contexts/ToastContext';

export interface ProductCardProps {
    title: string;
    price: number;
    images: string[];
    badges?: string[];
    onCardClick?: () => void;
    onAddToCart?: (e: React.MouseEvent) => void;
    product?: ProductMock; // Object sản phẩm đầy đủ (để check số lượng)
}

const ProductCard: React.FC<ProductCardProps> = ({ 
    title, 
    price, 
    images, 
    badges, 
    onCardClick,
    onAddToCart,
    product,
}) => {
    const { addToCart } = useCart();
    const { addToast } = useToast();

    // 1. Kiểm tra hết hàng (Dựa vào product.quantity)
    const isOutOfStock = product ? product.quantity <= 0 : false;

    return (
        <div className="bg-white border rounded overflow-hidden hover:shadow-lg transition-shadow group h-full flex flex-col">
            {/* Vùng ảnh & Thông tin (Click để xem chi tiết) */}
            <div 
                className="cursor-pointer flex-1"
                onClick={onCardClick}
            >
                <div className="relative overflow-hidden">
                    {/* Ảnh sản phẩm */}
                    <img 
                        src={images[0]} 
                        alt={title} 
                        className={`w-full h-64 object-cover transition-all duration-300 group-hover:scale-105 
                            ${isOutOfStock ? 'opacity-60 grayscale' : 'group-hover:opacity-90'}`} 
                    />
                    
                    {/* Badge Hết hàng (Ưu tiên hiển thị cao nhất) */}
                    {isOutOfStock && (
                        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 text-white font-bold px-4 py-2 rounded shadow-md z-10 whitespace-nowrap">
                            HẾT HÀNG
                        </span>
                    )}

                    {/* Các Badge khác (Chỉ hiện nếu còn hàng) */}
                    {!isOutOfStock && badges && badges.length > 0 && (
                        <span className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase shadow-sm">
                            {badges[0]}
                        </span>
                    )}
                </div>

                <div className="p-4">
                    {/* Ảnh thu nhỏ */}
                    <div className="flex items-center gap-2 mb-3">
                        {images.slice(0, 3).map((img, i) => (
                            <img 
                                key={i} 
                                src={img} 
                                alt={`${title} ${i + 1}`} 
                                className={`w-8 h-8 object-cover border rounded transition-colors ${isOutOfStock ? 'opacity-50' : 'hover:border-gray-400'}`} 
                            />
                        ))}
                    </div>

                    <div className="text-sm text-gray-700 mb-2 line-clamp-2 min-h-[40px] font-medium">
                        {title}
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className={`font-bold text-lg ${isOutOfStock ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                            {price.toLocaleString('vi-VN')} ₫
                        </div>
                        {/* Hiển thị số lượng còn lại (Optional) */}
                        {product && !isOutOfStock && product.quantity < 10 && (
                            <span className="text-[10px] text-orange-600 font-semibold bg-orange-50 px-2 py-1 rounded">
                                Còn {product.quantity}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            
            {/* Nút thêm vào giỏ */}
            <div className="px-4 pb-4 mt-auto">
                <button 
                    disabled={isOutOfStock} // Disable nếu hết hàng
                    onClick={(e) => {
                        e.stopPropagation(); // Ngăn click lan ra ngoài
                        
                        if (isOutOfStock) return;

                        // Ưu tiên dùng hàm từ Parent truyền xuống (Home, SearchResult)
                        if (onAddToCart) {
                            onAddToCart(e);
                            return;
                        }

                        // Fallback: Tự xử lý nếu không có hàm onAddToCart
                        if (product) {
                            addToCart(product, 1); // Gọi đúng cú pháp (product, quantity)
                            addToast(`${product.title} đã thêm vào giỏ.`, 'success');
                        }
                    }}
                    className={`w-full text-sm px-3 py-3 rounded font-semibold transition-colors flex justify-center items-center gap-2
                        ${isOutOfStock 
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed border border-gray-200' 
                            : 'border border-gray-800 hover:bg-gray-800 hover:text-white text-gray-800'
                        }`}
                >
                    {isOutOfStock ? (
                        <span>Hết hàng</span>
                    ) : (
                        <>
                            <span>Thêm vào giỏ</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;