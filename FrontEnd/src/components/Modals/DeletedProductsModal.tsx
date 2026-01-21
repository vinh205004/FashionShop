import { useEffect, useState } from 'react';
import { X, RotateCcw, Trash2 } from 'lucide-react';
import { getDeletedProducts, restoreProduct } from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

interface DeletedProduct {
    id: number;
    title: string;
    price: number;
    image: string;
    category: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onRestoreSuccess: () => void; // Gọi hàm này để refresh lại trang chính sau khi khôi phục
}

const DeletedProductsModal = ({ isOpen, onClose, onRestoreSuccess }: Props) => {
    const [deletedList, setDeletedList] = useState<DeletedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { addToast } = useToast();

    // Load dữ liệu mỗi khi mở Modal
    useEffect(() => {
        if (isOpen) {
            loadDeletedProducts();
        }
    }, [isOpen]);

    const loadDeletedProducts = async () => {
        setIsLoading(true);
        const data = await getDeletedProducts();
        setDeletedList(data);
        setIsLoading(false);
    };

    const handleRestore = async (id: number) => {
        try {
            await restoreProduct(id);
            addToast("Đã khôi phục sản phẩm thành công!", "success");
            
            // 1. Load lại danh sách thùng rác 
            loadDeletedProducts();
            
            // 2. Báo cho trang cha biết để load lại danh sách chính
            onRestoreSuccess();
        } catch (error) {
            console.error(error);
            addToast("Lỗi khi khôi phục", "error");
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <div className="flex items-center gap-2 text-red-600">
                        <Trash2 size={24} />
                        <h2 className="text-xl font-bold text-gray-800">Thùng Rác Sản Phẩm</h2>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded-full transition">
                        <X size={24} />
                    </button>
                </div>

                {/* Body: Danh sách */}
                <div className="flex-1 overflow-y-auto p-4">
                    {isLoading ? (
                        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                    ) : deletedList.length === 0 ? (
                        <div className="text-center py-10 flex flex-col items-center text-gray-400">
                            <Trash2 size={48} className="mb-2 opacity-50" />
                            <p>Thùng rác trống! Không có sản phẩm nào bị xóa.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-gray-500 border-b text-sm">
                                    <th className="py-2">Sản phẩm</th>
                                    <th className="py-2">Danh mục</th>
                                    <th className="py-2">Giá</th>
                                    <th className="py-2 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deletedList.map((item) => (
                                    <tr key={item.id} className="border-b hover:bg-gray-50 group">
                                        <td className="py-3 flex items-center gap-3">
                                            <img 
                                                src={item.image} 
                                                alt={item.title} 
                                                className="w-12 h-12 object-cover rounded border"
                                            />
                                            <span className="font-medium text-gray-700">{item.title}</span>
                                        </td>
                                        <td className="py-3 text-gray-600">{item.category}</td>
                                        <td className="py-3 font-medium text-blue-600">
                                            {item.price.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="py-3 text-right">
                                            <button
                                                onClick={() => handleRestore(item.id)}
                                                className="flex items-center gap-1 ml-auto px-3 py-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition font-medium text-sm"
                                                title="Khôi phục sản phẩm này"
                                            >
                                                <RotateCcw size={16} />
                                                Khôi phục
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 font-medium">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeletedProductsModal;