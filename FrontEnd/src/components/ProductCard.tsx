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
	product?: ProductMock; // optional full product to allow internal add-to-cart
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
	return (
		<div className="bg-white border rounded overflow-hidden hover:shadow-lg transition-shadow">
			{/* vùng card có thể click */}
			<div 
				className="cursor-pointer"
				onClick={onCardClick}
			>
				<div className="relative">
					<img 
						src={images[0]} 
						alt={title} 
						className="w-full h-64 object-cover hover:opacity-90 transition-opacity" 
					/>
					{badges && badges.length > 0 && (
						<span className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
							{badges[0]}
						</span>
					)}
				</div>
				<div className="p-4">
					<div className="flex items-center gap-2 mb-3">
						{images.slice(0, 3).map((img, i) => (
							<img 
								key={i} 
								src={img} 
								alt={`${title} ${i + 1}`}
								className="w-8 h-8 object-cover border rounded hover:border-gray-400 transition-colors" 
							/>
						))}
					</div>
					<div className="text-sm text-gray-700 mb-2 line-clamp-2">{title}</div>
					<div className="font-bold text-lg">{price.toLocaleString('vi-VN')} ₫</div>
				</div>
			</div>
			
			{/* nút thêm vào giỏ - xử lý sự kiện riêng biệt */}
			<div className="px-4 pb-4">
				<button 
					onClick={(e) => {
						e.stopPropagation(); // ngăn chặn click card
												if (onAddToCart) {
														onAddToCart(e);
														return;
												}
												// fallback: nếu product được truyền, gọi addToCart từ context
												if (product) {
													addToCart(product);
													addToast(`${product.title} đã được thêm vào giỏ hàng.`, 'success');
												}
					}}
					className="w-full text-sm px-3 py-2 border border-gray-800 rounded hover:bg-gray-800 hover:text-white transition-colors"
				>
					Thêm vào giỏ
				</button>
			</div>
		</div>
	);
};

export default ProductCard;