import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { getAllProducts } from "../services/mockProducts";
import type { ProductMock } from "../services/mockProducts";

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<ProductMock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState<ProductMock[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Tải tất cả sản phẩm khi mount
  useEffect(() => {
    getAllProducts().then(setAllProducts);
  }, []);

  // Đóng gợi ý khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Cập nhật gợi ý khi query tìm kiếm thay đổi
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const filtered = allProducts
      .filter(product => {
        const query = searchQuery.toLowerCase();
        return (
          product.title.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.subCategory?.toLowerCase().includes(query)
        );
      })
      .slice(0, 5); // Giới hạn 5 gợi ý

    setSuggestions(filtered);
  }, [searchQuery, allProducts]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setSearchQuery(""); // Xóa sau khi tìm kiếm
    }
  };

  const handleSuggestionClick = (productId: number) => {
    navigate(`/product/${productId}`);
    setShowSuggestions(false);
    setSearchQuery("");
  };

  const handleClear = () => {
    setSearchQuery("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <form onSubmit={handleSearch}>
        <div className="relative flex items-center border rounded-full px-4 py-2 bg-white">
          <Search className="text-gray-500" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Tìm kiếm"
            className="w-full outline-none px-3 text-sm"
          />
          
          {searchQuery && (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 ml-2"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </form>

      {/* Dropdown gợi ý */}
      {showSuggestions && searchQuery.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {suggestions.length > 0 ? (
            <>
              <div className="px-4 py-2 text-xs text-gray-500 border-b">
                Gợi ý tìm kiếm
              </div>
              {suggestions.map((product) => (
                <div
                  key={product.id}
                  onClick={() => handleSuggestionClick(product.id)}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
                >
                  <img
                    src={product.images[0]}
                    alt={product.title}
                    className="w-12 h-12 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-800 truncate">{product.title}</div>
                    <div className="text-xs text-gray-500">{product.category}</div>
                  </div>
                  <div className="text-sm font-semibold text-gray-800">
                    {product.price.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
              <button
                onClick={() => {
                  navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-3 text-sm text-blue-600 hover:bg-blue-50 text-center"
              >
                Xem tất cả kết quả cho "{searchQuery}"
              </button>
            </>
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              Không tìm thấy sản phẩm phù hợp
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;