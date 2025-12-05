namespace BackEnd.Models
{
    public class AddToCartRequest
    {
        public int UserId { get; set; } // Sau này dùng Token thì bỏ dòng này
        public int ProductId { get; set; }
        public int Quantity { get; set; }
        public string Size { get; set; } = string.Empty;
    }
}
