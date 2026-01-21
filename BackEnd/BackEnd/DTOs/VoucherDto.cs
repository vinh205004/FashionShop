namespace BackEnd.DTOs
{
    public class VoucherDto
    {
        public string Code { get; set; }
        public string DiscountType { get; set; } 
        public decimal DiscountValue { get; set; }
        public decimal? MinOrderValue { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? UsageLimit { get; set; }
        public bool IsActive { get; set; }
    }
}
