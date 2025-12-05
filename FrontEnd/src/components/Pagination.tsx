import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  maxVisiblePages?: number;
  className?: string;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  maxVisiblePages = 5,
  className = ""
}) => {
  // Nếu chỉ có 1 trang hoặc không có trang nào thì không hiện
  if (totalPages <= 1) return null;

  // 1. Tính toán trang bắt đầu và kết thúc (Logic cửa sổ trượt)
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = startPage + maxVisiblePages - 1;

  // Điều chỉnh nếu endPage vượt quá tổng số trang
  if (endPage > totalPages) {
    endPage = totalPages;
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  // Tạo mảng số trang để render
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  // Component nút bấm dùng chung cho gọn
  const PageButton = ({ 
    onClick, 
    disabled, 
    active, 
    children,
    ariaLabel 
  }: { 
    onClick: () => void, 
    disabled?: boolean, 
    active?: boolean, 
    children: React.ReactNode,
    ariaLabel: string 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`
        px-3 py-2 border rounded min-w-[40px] flex items-center justify-center transition-colors
        ${active 
          ? 'bg-black text-white border-black' 
          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white' : ''}
      `}
    >
      {children}
    </button>
  );

  return (
    <div className={`flex items-center justify-center gap-2 mt-8 ${className}`}>
      
      {/* Nút Về trang đầu (<<) - Chỉ hiện khi không ở trang 1 */}
      {currentPage > 1 && (
        <PageButton 
          onClick={() => onPageChange(1)} 
          ariaLabel="Trang đầu"
        >
          <ChevronsLeft size={16} />
        </PageButton>
      )}

      {/* Nút Trước (<) */}
      <PageButton 
        onClick={() => onPageChange(currentPage - 1)} 
        disabled={currentPage === 1}
        ariaLabel="Trang trước"
      >
        <ChevronLeft size={16} />
      </PageButton>

      {/* Các nút số trang */}
      {pageNumbers.map((page) => (
        <PageButton
          key={page}
          active={page === currentPage}
          onClick={() => onPageChange(page)}
          ariaLabel={`Trang ${page}`}
        >
          {page}
        </PageButton>
      ))}

      {/* Nút Tiếp (>) */}
      <PageButton 
        onClick={() => onPageChange(currentPage + 1)} 
        disabled={currentPage === totalPages}
        ariaLabel="Trang sau"
      >
        <ChevronRight size={16} />
      </PageButton>

      {/* Nút Đến trang cuối (>>) - Chỉ hiện khi chưa đến cuối */}
      {currentPage < totalPages && (
        <PageButton 
          onClick={() => onPageChange(totalPages)} 
          ariaLabel="Trang cuối"
        >
          <ChevronsRight size={16} />
        </PageButton>
      )}

    </div>
  );
};

export default Pagination;