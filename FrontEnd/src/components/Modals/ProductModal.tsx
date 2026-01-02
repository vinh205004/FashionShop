import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
    createProduct, 
    updateProduct, 
    type Category, 
    type ProductMock,
    type SubCategory // Import type
} from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  allSubCategories: SubCategory[]; // 👈 Nhận list tất cả sub
  productToEdit?: ProductMock | null;
}

const ProductModal = ({ isOpen, onClose, onSuccess, categories, allSubCategories, productToEdit }: Props) => {
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    description: "",
    categoryId: 0,
    subCategoryId: 0,
    sizes: [] as string[],
    images: [] as string[],
    badges: [] as string[]
  });

  // 1. LỌC DANH SÁCH SUB-CATEGORY THEO CATEGORY ĐANG CHỌN
  // (Đây là logic "đơn giản" mà hiệu quả bạn cần)
  const filteredSubCategories = allSubCategories.filter(
      sub => sub.categoryId === formData.categoryId
  );

  useEffect(() => {
    if (isOpen) {
        if (productToEdit) {
            // --- SỬA ---
            setFormData({
                title: productToEdit.title,
                price: productToEdit.price,
                description: productToEdit.description || "",
                categoryId: productToEdit.categoryId,
                subCategoryId: productToEdit.subCategoryId, // Lấy đúng ID cũ
                sizes: productToEdit.sizes || [],
                images: productToEdit.images || [],
                badges: productToEdit.badges || []
            });
        } else {
            // --- THÊM ---
            // Mặc định chọn category đầu tiên & sub đầu tiên của nó
            const firstCatId = categories[0]?.categoryId || 0;
            const validSubs = allSubCategories.filter(s => s.categoryId === firstCatId);
            
            setFormData({
                title: "", price: 0, description: "", images: [""], sizes: ["S", "M"], badges: [],
                categoryId: firstCatId,
                subCategoryId: validSubs[0]?.subCategoryId || 0
            });
        }
    }
  }, [productToEdit, isOpen, categories, allSubCategories]);

  // Khi người dùng đổi Category -> Tự reset SubCategory về cái đầu tiên hợp lệ
  const handleCategoryChange = (newCatId: number) => {
      const validSubs = allSubCategories.filter(s => s.categoryId === newCatId);
      setFormData(prev => ({
          ...prev,
          categoryId: newCatId,
          subCategoryId: validSubs[0]?.subCategoryId || 0 // Chọn cái đầu tiên hoặc 0
      }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (productToEdit) await updateProduct(productToEdit.id, formData);
      else await createProduct(formData);
      
      addToast(productToEdit ? "Đã cập nhật" : "Đã thêm mới", "success");
      onSuccess();
      onClose();
    } catch  {
      addToast("Lỗi xử lý", "error");
    }
  };

  // Helper ảnh... (Giữ nguyên)
  const handleImageChange = (index: number, value: string) => {
    const newImages = [...formData.images]; newImages[index] = value;
    setFormData({ ...formData, images: newImages });
  };
  const addImageField = () => setFormData({ ...formData, images: [...formData.images, ""] });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
            <h2 className="text-xl font-bold">{productToEdit ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Tên sản phẩm</label>
                    <input className="w-full border p-2 rounded mt-1" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Giá bán (VNĐ)</label>
                    <input type="number" className="w-full border p-2 rounded mt-1" required value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
            </div>

            {/* --- PHẦN CHỌN DANH MỤC ĐÃ SỬA --- */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Danh mục chính</label>
                    <select 
                        className="w-full border p-2 rounded mt-1" 
                        value={formData.categoryId} 
                        onChange={e => handleCategoryChange(Number(e.target.value))}
                    >
                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                    </select>
                </div>

                <div>
                    <label className="text-sm font-medium">Loại sản phẩm</label>
                    <select 
                        className="w-full border p-2 rounded mt-1" 
                        value={formData.subCategoryId} 
                        onChange={e => setFormData({...formData, subCategoryId: Number(e.target.value)})}
                    >
                        {/* Chỉ hiện những sub thuộc category đang chọn */}
                        {filteredSubCategories.map(s => (
                            <option key={s.subCategoryId} value={s.subCategoryId}>
                                {s.subCategoryName}
                            </option>
                        ))}
                        {filteredSubCategories.length === 0 && <option value="0">Không có mục con</option>}
                    </select>
                </div>
            </div>

            {/* Các phần khác (Mô tả, Ảnh, Size...) giữ nguyên */}
            <div>
                <label className="text-sm font-medium">Mô tả</label>
                <textarea rows={3} className="w-full border p-2 rounded mt-1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            <div>
                <label className="text-sm font-medium flex justify-between">
                    Hình ảnh <button type="button" onClick={addImageField} className="text-blue-600 text-xs">+ Thêm ảnh</button>
                </label>
                {formData.images.map((img, idx) => (
                    <div key={idx} className="flex gap-2 mt-2">
                        <input className="flex-1 border p-2 rounded text-sm" placeholder="URL ảnh..." value={img} onChange={e => handleImageChange(idx, e.target.value)} />
                        {img && <img src={img} alt="" className="w-10 h-10 object-cover rounded border" />}
                    </div>
                ))}
            </div>

            <div className="pt-4 border-t flex justify-end gap-3">
                <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Hủy</button>
                <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
                    {productToEdit ? "Lưu Cập Nhật" : "Tạo Mới"}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};
export default ProductModal;