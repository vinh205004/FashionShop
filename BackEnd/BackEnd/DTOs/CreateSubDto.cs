using System.ComponentModel.DataAnnotations;

namespace BackEnd.DTOs
{
    // DTO nhận dữ liệu
    public class CreateSubDto
    {
        public string SubCategoryName { get; set; }
        public string SubCategoryCode { get; set; }
        public int CategoryId { get; set; } // ID của cha
    }
}
