namespace BackEnd.Models
{
    public class PaymentRequest
    {
        public int OrderId { get; set; }
        public string PaymentMethod { get; set; } = "COD"; // COD, VNPAY, MOMO
        public decimal Amount { get; set; }
    }
}
