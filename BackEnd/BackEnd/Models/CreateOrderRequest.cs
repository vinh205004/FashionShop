namespace BackEnd.Models
{
    public class CreateOrderRequest
    {
        public int UserId { get; set; }
        public string ReceiverName { get; set; }
        public string ReceiverPhone { get; set; }
        public string ShippingAddress { get; set; }
        public string PaymentMethod { get; set; }
        public string? VoucherCode { get; set; }
        public List<int>? SelectedProductIds { get; set; }
    }
}
