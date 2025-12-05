import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getProductsPaged } from "../services/mockProducts"; 
import type { ProductMock } from "../services/mockProducts";
import { getCategories } from "../services/categoryService";
import type { Category } from "../services/categoryService";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";
import { getAllSizes } from "../services/mockProducts";

const CategoryPage: React.FC = () => {
  const { category, subcategory } = useParams<{ category: string; subcategory: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<ProductMock[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const PRODUCTS_PER_PAGE = 12; // Khớp với pageSize mặc định của Backend

  // Filter State
  const [selectedSizes, setSelectedSizes] = useState<string[]>(() => {
    const sizesParam = searchParams.get('sizes');
    return sizesParam ? sizesParam.split(',') : [];
  });
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(subcategory || null);
  
  const [sortBy, setSortBy] = useState<string>(() => searchParams.get('sort') || 'default');
  const [priceRange, setPriceRange] = useState<{ min: number; max: number }>({
    min: Number(searchParams.get('minPrice')) || 0,
    max: Number(searchParams.get('maxPrice')) || 10000000 // Tăng max lên cho thoải mái
  });
  const [tempPriceRange, setTempPriceRange] = useState<{ min: number; max: number }>({
    min: 0,
    max: 10000000
  });

  const [availableSizes, setAvailableSizes] = useState<string[]>([]);

  // 1. Tải danh mục (Menu)
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Error loading categories:", err);
        setError("Không thể tải danh mục");
      }
    };
    loadCategories();
  }, []);

  // 2. Đồng bộ URL khi SubCategory thay đổi
  useEffect(() => {
    setSelectedSubCategory(subcategory || null);
    setCurrentPage(1);
    window.scrollTo(0, 0);
  }, [subcategory]);

  // 3. Đồng bộ URL Params (Filters)
  useEffect(() => {
    const params: Record<string, string> = {};
    if (selectedSizes.length > 0) params.sizes = selectedSizes.join(',');
    if (sortBy !== 'default') params.sort = sortBy;
    if (priceRange.min > 0) params.minPrice = priceRange.min.toString();
    if (priceRange.max < 10000000) params.maxPrice = priceRange.max.toString();
    setSearchParams(params, { replace: true });
  }, [selectedSizes, sortBy, priceRange, setSearchParams]);

  // 4. HÀM TẢI SẢN PHẨM (QUAN TRỌNG NHẤT)
  const loadProducts = useCallback(async (page: number = 1) => {
    if (!category || categories.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentCategoryData = categories.find(cat => cat.slug === category);
      if (!currentCategoryData) throw new Error("Danh mục không tồn tại");
      
      // Lấy CategoryCode để gửi xuống Backend (VD: 'nu')
      const categoryCode = currentCategoryData.slug; 
      
      // GỌI API PHÂN TRANG TỪ BACKEND
      const result = await getProductsPaged(
        page, 
        PRODUCTS_PER_PAGE, 
        categoryCode, 
        selectedSubCategory || "",
        priceRange.min, // Truyền giá Min
        priceRange.max, // Truyền giá Max
        sortBy,// Truyền kiểu sắp xếp
        "",
        selectedSizes         
      );

      setProducts(result.data);
      setTotalProducts(result.total);

    } catch (err) {
      console.error("Error loading products:", err);
      setError("Không thể tải sản phẩm");
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [category, selectedSubCategory, categories, priceRange, sortBy, selectedSizes ]); 
  

  useEffect(() => {
    loadProducts(currentPage);
  }, [loadProducts, currentPage]);

  // Load danh sách Size từ Server
  useEffect(() => {
    const fetchSizes = async () => {
      const sizes = await getAllSizes();
      
      // Mẹo nhỏ: Sắp xếp size cho đẹp (Tùy chọn)
      // Nếu không sắp xếp, nó sẽ hiện lộn xộn theo thứ tự trong SQL
      const sortedSizes = sizes.sort((a, b) => {
        // Ưu tiên số xếp trước, chữ xếp sau (logic đơn giản)
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      });

      setAvailableSizes(sortedSizes);
    };
    fetchSizes();
  }, []);
  // --- HANDLERS ---
  const handleSizeToggle = (size: string) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCategoryClick = () => {
    setSelectedSubCategory(null);
    setCurrentPage(1);
    navigate(`/${category}`);
  };

  const handleClearFilters = () => {
    setSelectedSizes([]);
    setSortBy('default');
    setPriceRange({ min: 0, max: 10000000 });
    setTempPriceRange({ min: 0, max: 10000000 });
    setCurrentPage(1);
  };

  const handleApplyPriceFilter = () => {
    setPriceRange(tempPriceRange);
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price);
  const currentCategory = categories.find(cat => cat.slug === category);

  // --- RENDER ---
  if (isLoading && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-8 px-4 flex gap-8 animate-pulse">
        <div className="w-1/4 h-96 bg-gray-200 rounded hidden md:block"></div>
        <div className="flex-1 space-y-4">
           <div className="h-8 bg-gray-200 w-1/3 rounded"></div>
           <div className="grid grid-cols-4 gap-4">
             {[1,2,3,4].map(i => <div key={i} className="h-64 bg-gray-200 rounded"></div>)}
           </div>
        </div>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="max-w-7xl mx-auto py-10 px-4 text-center">
        <h3 className="text-red-600 text-xl font-bold mb-2">Có lỗi xảy ra</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-4 py-2 bg-black text-white rounded">Thử lại</button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8 px-4">
      <div className="flex gap-8">
        
        {/* SIDEBAR (BỘ LỌC) */}
        <div className="w-1/4 bg-white rounded-lg shadow-sm p-6 h-fit sticky top-4 hidden md:block">
          
          {/* Nút Xóa bộ lọc */}
          {(selectedSizes.length > 0 || sortBy !== 'default' || priceRange.min > 0) && (
            <div className="mb-4 flex items-center justify-between bg-gray-100 p-2 rounded">
              <span className="text-xs font-semibold">Đang lọc...</span>
              <button onClick={handleClearFilters} className="text-xs text-red-500 hover:underline">Xóa hết</button>
            </div>
          )}

          {/* Danh mục con */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Danh mục</h3>
            <div className="space-y-1">
              <div 
                className={`cursor-pointer py-2 px-3 rounded transition-colors ${!selectedSubCategory ? 'bg-black text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                onClick={handleCategoryClick}
              >
                Tất cả
              </div>
              {currentCategory?.subCategories.map((sub) => (
                <div
                  key={sub.id}
                  className={`cursor-pointer py-2 px-3 rounded transition-colors ${selectedSubCategory === sub.slug ? 'bg-black text-white font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                  onClick={() => {
                    setSelectedSubCategory(sub.slug);
                    setCurrentPage(1);
                    navigate(`/${category}/${sub.slug}`);
                  }}
                >
                  {sub.name}
                </div>
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
              <option value="price-asc">Giá tăng dần</option>
              <option value="price-desc">Giá giảm dần</option>
              <option value="newest">Mới nhất</option>
            </select>
          </div>

          {/* Khoảng giá */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg">Giá tiền</h3>
            <div className="flex items-center gap-2 mb-3">
              <input 
                type="number" 
                value={tempPriceRange.min} 
                onChange={e => setTempPriceRange({...tempPriceRange, min: Number(e.target.value)})}
                className="w-full border p-2 rounded text-sm" placeholder="Min" 
              />
              <span>-</span>
              <input 
                type="number" 
                value={tempPriceRange.max} 
                onChange={e => setTempPriceRange({...tempPriceRange, max: Number(e.target.value)})}
                className="w-full border p-2 rounded text-sm" placeholder="Max" 
              />
            </div>
             <div className="text-xs text-gray-500 text-center mb-2">
               {formatPrice(tempPriceRange.min)} - {formatPrice(tempPriceRange.max)} ₫
            </div>
            <button onClick={handleApplyPriceFilter} className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded text-sm font-semibold transition-colors">
              Áp dụng
            </button>
          </div>

          {/* Kích cỡ */}
          <div>
            <h3 className="font-bold mb-3 text-lg">Kích cỡ</h3>
            <div className="flex flex-wrap gap-2">
              {availableSizes.map(size => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`min-w-[40px] px-2 py-2 border rounded text-sm transition-colors ${selectedSizes.includes(size) ? 'bg-black text-white border-black' : 'bg-white hover:border-black'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2 uppercase">
              {currentCategory?.name} {selectedSubCategory && `- ${currentCategory?.subCategories.find(s => s.slug === selectedSubCategory)?.name}`}
            </h1>
            <p className="text-gray-500">Tìm thấy {totalProducts} sản phẩm</p>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <p className="text-gray-500 text-lg">Không tìm thấy sản phẩm nào.</p>
              <button onClick={handleClearFilters} className="mt-4 text-blue-600 hover:underline">Xóa bộ lọc</button>
            </div>
          ) : (
            <>
              {/* Grid Sản Phẩm */}
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
                  />
                ))}
              </div>

              {/* Phân trang (Server-side) */}
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

export default CategoryPage;