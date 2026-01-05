import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { 
    createCategory, updateCategory, deleteCategory,
    createSubCategory, updateSubCategory, deleteSubCategory,
    getSubCategoriesByCatId,
    getCategories,
    type Category
} from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SubItem {
    subCategoryId: number;
    subCategoryName: string;
    subCategoryCode: string;
}

const CategoryModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const { addToast } = useToast();
  
  // Data Lists
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [subCategories, setSubCategories] = useState<SubItem[]>([]);


  // Form State (Dùng chung cho cả Add/Edit Cha và Con)
  const [mode, setMode] = useState<'ADD_CAT' | 'EDIT_CAT' | 'ADD_SUB' | 'EDIT_SUB' | null>(null);
  const [formData, setFormData] = useState({ id: 0, name: "", code: "" });

  // Load danh mục cha khi mở modal
  useEffect(() => {
    if (isOpen) fetchCategories();
  }, [isOpen]);

  // Load danh mục con khi chọn cha
  useEffect(() => {
    if (selectedCat) {
        fetchSubCategories(selectedCat.categoryId);
    } else {
        setSubCategories([]);
    }
  }, [selectedCat]);

  const fetchCategories = async () => {
    const res = await getCategories();
    setCategories(res);
  };

  const fetchSubCategories = async (catId: number) => {
    try {
        const res = await getSubCategoriesByCatId(catId);
        setSubCategories(res);
    } catch { setSubCategories([]); }
  };

  // --- HANDLERS CHO CATEGORY (CHA) ---
  const handleDeleteCat = async (id: number) => {
    if (!window.confirm("Bạn muốn xóa danh mục này?")) return;
    try {
        await deleteCategory(id);
        addToast("Đã xóa danh mục", "success");
        fetchCategories();
        if (selectedCat?.categoryId === id) setSelectedCat(null);
        onSuccess();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        addToast(err.response?.data || "Không thể xóa (đang có chứa sản phẩm)", "error");
    }
  };

  // --- HANDLERS CHO SUB-CATEGORY (CON) ---
  const handleDeleteSub = async (id: number) => {
    if (!window.confirm("Bạn muốn xóa loại sản phẩm này?")) return;
    try {
        await deleteSubCategory(id);
        addToast("Đã xóa mục con", "success");
        if (selectedCat) fetchSubCategories(selectedCat.categoryId);
        onSuccess();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
        addToast(err.response?.data || "Không thể xóa (đang có chứa sản phẩm)", "error");
    }
  };

  // --- FORM SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (mode === 'ADD_CAT') {
            await createCategory(formData.name, formData.code);
            fetchCategories();
        } 
        else if (mode === 'EDIT_CAT') {
            await updateCategory(formData.id, formData.name, formData.code);
            fetchCategories();
        }
        else if (mode === 'ADD_SUB' && selectedCat) {
            await createSubCategory(formData.name, formData.code, selectedCat.categoryId);
            fetchSubCategories(selectedCat.categoryId);
        }
        else if (mode === 'EDIT_SUB' && selectedCat) {
            await updateSubCategory(formData.id, formData.name, formData.code);
            fetchSubCategories(selectedCat.categoryId);
        }

        addToast("Thành công!", "success");
        setMode(null); // Tắt form
        setFormData({ id: 0, name: "", code: "" });
        onSuccess(); // Báo ra ngoài để ProductManager cập nhật
    } catch {
        addToast("Có lỗi xảy ra", "error");
    }
  };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openForm = (action: typeof mode, item?: any) => {
    setMode(action);
    if (item) setFormData({ id: item.categoryId || item.subCategoryId, name: item.categoryName || item.subCategoryName, code: item.categoryCode || item.subCategoryCode || "" });
    else setFormData({ id: 0, name: "", code: "" });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[500px] flex overflow-hidden shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black z-10">
            <X size={24} />
        </button>

        {/* CỘT TRÁI: DANH MỤC CHA */}
        <div className="w-1/2 border-r flex flex-col bg-gray-50">
            <div className="p-4 border-b bg-white flex justify-between items-center sticky top-0">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Folder size={18}/> Danh Mục Chính</h3>
                <button onClick={() => openForm('ADD_CAT')} className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"><Plus size={18}/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {categories.map(cat => (
                    <div 
                        key={cat.categoryId} 
                        onClick={() => { setSelectedCat(cat); setMode(null); }}
                        className={`p-3 rounded-lg cursor-pointer flex justify-between items-center group transition-all ${selectedCat?.categoryId === cat.categoryId ? 'bg-blue-600 text-white shadow-md' : 'bg-white hover:bg-gray-100'}`}
                    >
                        <span className="font-medium">{cat.categoryName}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => {e.stopPropagation(); openForm('EDIT_CAT', cat)}} className={`p-1.5 rounded ${selectedCat?.categoryId === cat.categoryId ? 'text-white hover:bg-blue-500' : 'text-gray-500 hover:bg-gray-200'}`}><Edit2 size={14}/></button>
                            <button onClick={(e) => {e.stopPropagation(); handleDeleteCat(cat.categoryId)}} className={`p-1.5 rounded ${selectedCat?.categoryId === cat.categoryId ? 'text-white hover:bg-red-500' : 'text-red-500 hover:bg-red-50'}`}><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* CỘT PHẢI: DANH MỤC CON */}
        <div className="w-1/2 flex flex-col bg-white">
            <div className="p-4 border-b flex justify-between items-center h-[57px]">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    {selectedCat ? <><FolderOpen size={18} className="text-blue-600"/> {selectedCat.categoryName} <ChevronRight size={14}/> Mục con</> : "Chọn danh mục bên trái"}
                </h3>
                {selectedCat && (
                    <button onClick={() => openForm('ADD_SUB')} className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"><Plus size={18}/></button>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 space-y-2 relative">
                {/* Overlay Form nếu đang mở */}
                {mode && (
                    <div className="absolute inset-0 bg-white/95 z-10 flex items-center justify-center p-6 backdrop-blur-sm">
                        <div className="w-full">
                            <h4 className="font-bold mb-4 text-center text-lg">
                                {mode === 'ADD_CAT' ? "Thêm Danh Mục Chính" : 
                                 mode === 'EDIT_CAT' ? "Sửa Danh Mục Chính" :
                                 mode === 'ADD_SUB' ? `Thêm mục con cho "${selectedCat?.categoryName}"` : "Sửa Mục Con"}
                            </h4>
                            <form onSubmit={handleSubmit} className="space-y-3">
                                <input className="w-full border p-2 rounded" placeholder="Tên (VD: Áo Thun)" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required autoFocus/>
                                <input className="w-full border p-2 rounded" placeholder="Mã (VD: ao-thun)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} required />
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setMode(null)} className="flex-1 py-2 bg-gray-200 rounded hover:bg-gray-300">Hủy</button>
                                    <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Lưu</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* List SubCategories */}
                {!selectedCat ? (
                    <div className="text-center text-gray-400 mt-20">Hãy chọn một danh mục cha để xem các mục con</div>
                ) : subCategories.length === 0 ? (
                    <div className="text-center text-gray-400 mt-20">Chưa có danh mục con nào.</div>
                ) : (
                    subCategories.map(sub => (
                        <div key={sub.subCategoryId} className="p-3 border rounded-lg flex justify-between items-center group hover:border-blue-300 hover:shadow-sm">
                            <span className="text-gray-700">{sub.subCategoryName}</span>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openForm('EDIT_SUB', sub)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14}/></button>
                                <button onClick={() => handleDeleteSub(sub.subCategoryId)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
export default CategoryModal;