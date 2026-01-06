using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs
{
    // DTO dùng cho việc Thêm mới (Create)
    public class ProductCreateDto
    {
        [Required]
        public string Title { get; set; }

        [Required]
        public decimal Price { get; set; }

        public string Description { get; set; }

        // ID của danh mục đã chọn
        public int CategoryId { get; set; }
        public int SubCategoryId { get; set; }
        public int Quantity { get; set; } = 0;

        // Các danh sách (Mảng) gửi từ React lên
        public List<string> Sizes { get; set; }  // ["S", "M", "L"]
        public List<string> Images { get; set; } // ["url1", "url2"]
        public List<string> Badges { get; set; } // ["New", "Sale"]
    }

    // Sau này nếu cần DTO cho việc Sửa (Update) thì viết tiếp xuống dưới này
    // public class ProductUpdateDto { ... }
}