using System.ComponentModel.DataAnnotations;


namespace BackEnd.DTOs
{
    // DTO nhận dữ liệu từ Frontend
    public class UpdateStatusDto
    {
        public string Status { get; set; } // "Confirmed", "Cancelled"...
    }
}
