import { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { 
  createProduct, 
  updateProduct,
  getAllSizes,
  type Category, 
  type ProductMock, 
  type SubCategory 
} from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  allSubCategories: SubCategory[]; 
  productToEdit?: ProductMock | null;
}

const ProductModal = ({ isOpen, onClose, onSuccess, categories, allSubCategories, productToEdit }: Props) => {
  const { addToast } = useToast();

  const [availableSizes, setAvailableSizes] = useState<string[]>(["S", "M", "L", "XL", "XXL"]);

  const [formData, setFormData] = useState({
    title: "",
    price: 0,
    quantity: 100, 
    description: "",
    categoryId: 0,
    subCategoryId: 0,
    sizes: [] as string[],
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  const filteredSubCategories = allSubCategories.filter(
      sub => sub.categoryId === formData.categoryId
  );

  useEffect(() => {
    if (isOpen) {
        // A. Load danh sách Size động từ API
        const fetchSizes = async () => {
            try {
                const dbSizes = await getAllSizes();
                // Gộp size mặc định + size từ DB (Dùng Set để loại bỏ trùng lặp)
                const mergedSizes = Array.from(new Set(["S", "M", "L", "XL", "XXL", ...dbSizes]));
                setAvailableSizes(mergedSizes);
            } catch (error) {
                console.error("Lỗi lấy sizes:", error);
            }
        };
        fetchSizes();

        // B. Load dữ liệu Form
        if (productToEdit) {
            // --- EDIT MODE ---
            setFormData({
                title: productToEdit.title,
                price: productToEdit.price,
                quantity: productToEdit.quantity || 0,
                description: productToEdit.description || "",
                categoryId: productToEdit.categoryId,
                subCategoryId: productToEdit.subCategoryId, 
                sizes: productToEdit.sizes || [],
            });
            
            if (productToEdit.images && productToEdit.images.length > 0) {
                setPreviewUrl(productToEdit.images[0]);
            } else {
                setPreviewUrl("");
            }
            setSelectedFile(null); 
        } else {
            // --- CREATE MODE ---
            const firstCatId = categories[0]?.categoryId || 0;
            const validSubs = allSubCategories.filter(s => s.categoryId === firstCatId);
            
            setFormData({
                title: "", price: 0, quantity: 100, description: "", 
                sizes: ["S", "M"], // Mặc định chọn S, M cho nhanh
                categoryId: firstCatId,
                subCategoryId: validSubs[0]?.subCategoryId || 0
            });
            setPreviewUrl("");
            setSelectedFile(null);
        }
    }
  }, [productToEdit, isOpen, categories, allSubCategories]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    }
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => {
        const currentSizes = prev.sizes || [];
        return currentSizes.includes(size)
            ? { ...prev, sizes: currentSizes.filter(s => s !== size) }
            : { ...prev, sizes: [...currentSizes, size] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const dataToSend = new FormData();
    
    // 1. Xử lý số và chuỗi
    // Nếu không có giá trị thì gửi số 0 hoặc chuỗi rỗng, không gửi null
    dataToSend.append("Title", formData.title || "");
    dataToSend.append("Price", String(formData.price || 0)); 
    dataToSend.append("Quantity", String(formData.quantity || 0));
    dataToSend.append("Description", formData.description || "");
    dataToSend.append("CategoryId", String(formData.categoryId || 0));
    
    // SubCategory: Nếu = 0 thì backend sẽ tự hiểu là null 
    dataToSend.append("SubCategoryId", String(formData.subCategoryId || 0));

    // 2. Xử lý Mảng Size (QUAN TRỌNG NHẤT)
    // Phải gửi dạng Sizes[0], Sizes[1] để .NET Core map được vào List<string>
    if (formData.sizes && formData.sizes.length > 0) {
        formData.sizes.forEach((size, index) => {
            dataToSend.append(`Sizes[${index}]`, size);
        });
    } else {
        // Nếu không có size, gửi mảng rỗng để không bị lỗi null binding
        // (Tùy backend, nhưng an toàn thì cứ bỏ qua cũng được)
    }

    // 3. Xử lý File ảnh
    if (selectedFile) {
        dataToSend.append("ImageFile", selectedFile);
    }

    try {
      if (productToEdit) {
         // Update
         await updateProduct(productToEdit.id, dataToSend);
      } else {
         // Create
         await createProduct(dataToSend);
      }
      
      addToast(productToEdit ? "Đã cập nhật" : "Đã thêm mới", "success");
      onSuccess();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Lỗi chi tiết:", error);
      
      // Hiển thị lỗi từ Backend trả về (Nếu bắt được)
      if (error.response?.data?.errors) {
          // Lấy lỗi đầu tiên để hiển thị
          const errors = error.response.data.errors;
          const firstKey = Object.keys(errors)[0];
          const firstMsg = errors[firstKey][0];
          addToast(`Lỗi dữ liệu: ${firstKey} - ${firstMsg}`, "error");
      } 
      else if (error.response?.data) {
          // Lỗi chung chung (VD: string)
           addToast(`Lỗi Server: ${JSON.stringify(error.response.data)}`, "error");
      }
      else {
          addToast("Lỗi kết nối hoặc xử lý", "error");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white px-6 py-4 border-b flex justify-between items-center z-10">
            <h2 className="text-xl font-bold">{productToEdit ? "Cập Nhật Sản Phẩm" : "Thêm Sản Phẩm Mới"}</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            
            {/* Ảnh đại diện & Preview */}
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                {previewUrl ? (
                    <div className="relative group">
                        <img src={previewUrl} alt="Preview" className="h-40 object-contain rounded shadow" />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded text-white font-medium">
                            Đổi ảnh
                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>
                ) : (
                    <label className="cursor-pointer flex flex-col items-center">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Nhấn để tải ảnh lên</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                    </label>
                )}
            </div>

            {/* Hàng 1: Tên & Giá */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Tên sản phẩm</label>
                    <input className="w-full border p-2 rounded mt-1" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Giá bán (VNĐ)</label>
                    <input type="number" className="w-full border p-2 rounded mt-1" required min="0" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                </div>
            </div>

            {/* Hàng 2: Số lượng & Danh mục */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Số lượng kho</label>
                    <input type="number" className="w-full border p-2 rounded mt-1" required min="0" value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} />
                </div>
                <div>
                    <label className="text-sm font-medium">Danh mục chính</label>
                    <select 
                        className="w-full border p-2 rounded mt-1" 
                        value={formData.categoryId} 
                        onChange={e => setFormData({...formData, categoryId: Number(e.target.value)})}
                    >
                        {categories.map(c => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                    </select>
                </div>
            </div>

            {/* Hàng 3: Sub & Size */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="text-sm font-medium">Loại sản phẩm</label>
                    <select 
                        className="w-full border p-2 rounded mt-1" 
                        value={formData.subCategoryId} 
                        onChange={e => setFormData({...formData, subCategoryId: Number(e.target.value)})}
                    >
                        {filteredSubCategories.map(s => <option key={s.subCategoryId} value={s.subCategoryId}>{s.subCategoryName}</option>)}
                        <option value="0">Khác</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm font-medium block mb-1">Size</label>
                    <div className="flex flex-wrap gap-2">
                        {/* 👈 4. Render danh sách từ state availableSizes */}
                        {availableSizes.map(size => (
                            <button
                                key={size} type="button"
                                onClick={() => handleSizeToggle(size)}
                                className={`px-2 py-1 text-xs border rounded transition-colors ${
                                    formData.sizes.includes(size) 
                                    ? 'bg-blue-600 text-white border-blue-600' 
                                    : 'bg-white text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                {size}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <label className="text-sm font-medium">Mô tả</label>
                <textarea rows={3} className="w-full border p-2 rounded mt-1" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
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