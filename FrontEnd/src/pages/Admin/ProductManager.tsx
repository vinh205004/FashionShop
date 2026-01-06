import { useEffect, useState } from 'react';
import { Edit, Trash2, Search, Filter, FolderPlus, PackagePlus } from 'lucide-react';
import { 
  getAllProducts, 
  getCategories,
  getAllSubCategories,
  deleteProduct, 
  type ProductMock, 
  type Category,
  type SubCategory
} from '../../services/mockProducts';
import { useToast } from '../../contexts/ToastContext';

// Import Modal
import CategoryModal from '../../components/Modals/CategoryModal';
import ProductModal from '../../components/Modals/ProductModal';

const ProductManager = () => {
  const [products, setProducts] = useState<ProductMock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Modal
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductMock | null>(null);

  const [filterCat, setFilterCat] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const { addToast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [prodData, catData, subData] = await Promise.all([getAllProducts(), getCategories(), getAllSubCategories()]);
      setProducts(prodData);
      setCategories(catData);
      setSubCategories(subData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setIsProdModalOpen(true);
  };

  const handleOpenEdit = (product: ProductMock) => {
    setEditingProduct(product);
    setIsProdModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa?")) {
      try {
        await deleteProduct(id);
        addToast("Đã xóa", "success");
        fetchData(); 
      } catch  {
        addToast("Lỗi xóa", "error");
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const matchCat = filterCat === "All" || p.category === filterCat;
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <CategoryModal isOpen={isCatModalOpen} onClose={() => setIsCatModalOpen(false)} onSuccess={fetchData} />
      <ProductModal 
        isOpen={isProdModalOpen} 
        onClose={() => setIsProdModalOpen(false)} 
        onSuccess={fetchData} 
        categories={categories}
        allSubCategories={subCategories}
        productToEdit={editingProduct} 
      />
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
        <div>
           <h2 className="text-xl font-bold text-gray-800">Quản lý sản phẩm</h2>
           <p className="text-sm text-gray-500">Tổng: {filteredProducts.length} sản phẩm</p>
        </div>
        <div className="flex gap-3">
            <button onClick={() => setIsCatModalOpen(true)} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition font-medium">
                <FolderPlus size={18} /> <span>Thêm danh mục</span>
            </button>
            <button onClick={handleOpenAdd} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition font-medium">
                <PackagePlus size={18} /> <span>Thêm sản phẩm</span>
            </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="relative min-w-[200px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <select className="w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none cursor-pointer"
                value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">Tất cả danh mục</option>
                {categories.map(c => <option key={c.categoryId} value={c.categoryName}>{c.categoryName}</option>)}
            </select>
        </div>
      </div>

      {/* LIST */}
      {loading ? ( <div className="text-center py-10">Đang tải...</div> ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div key={product.id} className="group bg-white rounded-xl border border-gray-100 p-3 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden border">
                <img src={product.images[0] || "https://via.placeholder.com/150"} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                    <div>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{product.category || "N/A"}</span>
                        <h3 className="font-bold text-gray-800 mt-1 truncate pr-2 group-hover:text-blue-600">{product.title}</h3>
                    </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-500">
                    Kho: <span className={`font-bold ${product.quantity === 0 ? 'text-red-500' : 'text-gray-800'}`}>
                        {product.quantity}
                    </span>
                </div>

                <div className="mt-1 flex items-center justify-between">
                    <p className="text-lg font-bold text-red-600">{product.price.toLocaleString('vi-VN')} ₫</p>
                    <div className="flex gap-2">
                        <button onClick={() => handleOpenEdit(product)} className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Sửa">
                            <Edit size={18} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default ProductManager;