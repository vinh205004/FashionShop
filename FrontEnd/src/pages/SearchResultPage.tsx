import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
// Import API
import { getProductsPaged, getAllSizes } from "../services/mockProducts"; // <--- Import thêm getAllSizes
import type { ProductMock } from "../services/mockProducts";
import { getCategories } from "../services/categoryService"; 
import type { Category } from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import { useToast } from "../contexts/ToastContext";
import Pagination from "../components/Pagination";
import { Search, X } from "lucide-react";

const SearchResultPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  // Lấy keyword từ URL (?q=...)
  const query = searchParams.get("q") || "";
  const [searchQuery, setSearchQuery] = useState(query);
  
  // State dữ liệu
  const [products, setProducts] = useState<ProductMock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]); 
  const [isLoading, setIsLoading] = useState(false);
  const [totalProducts, setTotalProducts] = useState(0);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 12; 
  
  // Filter State
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]); 
  const [sortBy, setSortBy] = useState<string>("default");
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000000
  });

  // State Size (Lấy từ API)
  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  // 1. Tải danh mục sidebar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error(error);
      }
    };
    loadCategories();
  }, []);

  // 2. Tải danh sách Size từ API (MỚI THÊM)
  useEffect(() => {
    const fetchSizes = async () => {
      const sizes = await getAllSizes();
      // Sắp xếp size (Số trước, chữ sau)
      const sortedSizes = sizes.sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });
      setAvailableSizes(sortedSizes);
    };
    fetchSizes();
  }, []);

  // 3. Reset ô tìm kiếm và trang khi URL thay đổi
  useEffect(() => {
    setSearchQuery(query);
    // Nếu đổi từ khóa thì về trang 1
  }, [query]);

  // 4. HÀM GỌI API TÌM KIẾM (Server-side)
  const performSearch = useCallback(async () => {
    setIsLoading(true);
    try {
      const targetCategory = selectedCategories.length > 0 ? selectedCategories[0] : ""; 
      
      const result = await getProductsPaged(
        currentPage,
        PRODUCTS_PER_PAGE,
        targetCategory, 
        "", // subCategory
        priceRange.min,
        priceRange.max,
        sortBy,
        query, // Từ khóa tìm kiếm
        selectedSizes // <--- Gửi danh sách size đã chọn xuống Backend
      );

      setProducts(result.data);
      setTotalProducts(result.total);

    } catch (error) {
      console.error("Lỗi tìm kiếm:", error);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [query, currentPage, sortBy, priceRange, selectedCategories, selectedSizes]); 

  // Gọi API khi các điều kiện thay đổi
  useEffect(() => {
    performSearch();
  }, [performSearch]);


  // --- HANDLERS ---
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
      setCurrentPage(1); 
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchParams({});
    setCurrentPage(1);
  };

  const handleCategoryToggle = (categoryCode: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryCode)
        ? prev.filter(c => c !== categoryCode)
        : [...prev, categoryCode]
    );
    setCurrentPage(1);
  };

  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    setCurrentPage(1); // Reset về trang 1 khi lọc size
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSortBy("default");
    setPriceRange({ min: 0, max: 10000000 });
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      
      {/* THANH TÌM KIẾM */}
      <div className="mb-8">
        <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm sản phẩm..."
              className="w-full px-4 py-3 pr-24 border border-gray-300 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition-colors"
            >
              <Search size={20} />
            </button>
          </div>
        </form>
      </div>

      <div className="flex gap-8">
        
        {/* SIDEBAR BỘ LỌC */}
        <div className="w-1/4 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4 hidden md:block">
          
          {/* Nút Xóa bộ lọc */}
          {(selectedCategories.length > 0 || selectedSizes.length > 0 || sortBy !== 'default' || priceRange.min > 0) && (
            <div className="mb-4 flex items-center justify-between bg-gray-100 p-2 rounded">
              <span className="text-xs font-semibold">Đang lọc...</span>
              <button onClick={handleClearFilters} className="text-xs text-red-500 hover:underline">Xóa hết</button>
            </div>
          )}

          {/* Danh mục (Checkbox) */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Danh mục</h3>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(cat.slug)}
                    onChange={() => handleCategoryToggle(cat.slug)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm text-gray-700">{cat.name}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Sắp xếp</h3>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
            >
              <option value="default">Mặc định</option>
              <option value="price-asc">Giá: Thấp đến Cao</option>
              <option value="price-desc">Giá: Cao đến Thấp</option>
              <option value="name-asc">Tên: A-Z</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>

          {/* Giá tiền */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Khoảng giá</h3>
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="number" 
                value={priceRange.min} 
                onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
                className="w-full border p-2 rounded text-sm" placeholder="Min" 
              />
              <span>-</span>
              <input 
                type="number" 
                value={priceRange.max} 
                onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
                className="w-full border p-2 rounded text-sm" placeholder="Max" 
              />
            </div>
            <div className="text-xs text-gray-500 text-center mb-2">
               {formatPrice(priceRange.min)} - {formatPrice(priceRange.max)} ₫
            </div>
          </div>

          {/* Kích cỡ (Lấy từ API) */}
          <div>
            <h3 className="font-bold mb-3 text-lg">Kích cỡ</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.length > 0 ? availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`min-w-[40px] px-2 py-2 border rounded text-sm transition-colors ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white hover:border-black'}`}
                >
                  {size}
                </button>
              )) : (
                <span className="text-sm text-gray-400">Đang tải size...</span>
              )}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          {/* Header Kết quả */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              {query ? `Kết quả tìm kiếm: "${query}"` : "Tất cả sản phẩm"}
            </h1>
            <p className="text-gray-600">Tìm thấy {totalProducts} sản phẩm</p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
               {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-80 bg-gray-200 rounded"></div>)}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && products.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <Search size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">Không tìm thấy sản phẩm nào</h3>
              <p className="text-gray-500 mb-4">Hãy thử từ khóa khác hoặc xóa bộ lọc.</p>
              <button onClick={handleClearFilters} className="text-blue-600 hover:underline font-medium">Xóa toàn bộ lọc</button>
            </div>
          )}

          {/* Product Grid */}
          {!isLoading && products.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    title={product.title}
                    price={product.price}
                    images={product.images}
                    badges={product.badges}
                    onCardClick={() => navigate(`/product/${product.id}`)}
                    onAddToCart={() => {
                        console.log('Add cart', product.id);
                        addToast(`Đã thêm "${product.title}" vào giỏ hàng`, 'success');
                    }}
                  />
                ))}
              </div>

              {/* Phân trang */}
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalProducts / PRODUCTS_PER_PAGE)}
                onPageChange={handlePageChange}
                className="mt-10"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResultPage;