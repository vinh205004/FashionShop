namespace BackEnd.Models
{
    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        public string ReceiverName { get; set; } = string.Empty;
        public string ReceiverPhone { get; set; } = string.Empty;
        public string ShippingAddress { get; set; } = string.Empty;
        public string? VoucherCode { get; set; } // Mã voucher (có thể null)
        public string PaymentMethod { get; set; } = "COD";
    }
}
