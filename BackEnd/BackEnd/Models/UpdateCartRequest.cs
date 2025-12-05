namespace BackEnd.Models
{
    public class UpdateCartRequest
    {
        public int CartItemId { get; set; }
        public int Quantity { get; set; }
        public string? Size { get; set; }
    }
}
