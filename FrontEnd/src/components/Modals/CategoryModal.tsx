import { useState } from 'react';
import { X } from 'lucide-react';
import { createCategory } from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CategoryModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { addToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCategory(name, code);
      addToast("Thêm danh mục thành công", "success");
      setName(""); setCode("");
      onSuccess();
      onClose();
    } catch  {
      addToast("Lỗi khi thêm danh mục", "error");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black">
            <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-4">Thêm Danh Mục</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên danh mục</label>
            <input 
                className="w-full border p-2 rounded mt-1" 
                value={name} onChange={e => setName(e.target.value)} required 
                placeholder="Ví dụ: Áo Khoác"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mã (Code)</label>
            <input 
                className="w-full border p-2 rounded mt-1" 
                value={code} onChange={e => setCode(e.target.value)} required 
                placeholder="Ví dụ: ao-khoac"
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            Lưu
          </button>
        </form>
      </div>
    </div>
  );
};
export default CategoryModal;