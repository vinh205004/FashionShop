using BackEnd.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public OrdersController(FashionShopDbContext context)
        {
            _context = context;
        }

        // API 1: TẠO ĐƠN HÀNG (CHECKOUT)
        // POST: api/Orders/create
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            // 1. Lấy giỏ hàng của User từ DB
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product) // Để lấy giá tiền hiện tại
                .FirstOrDefaultAsync(c => c.UserId == request.UserId);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest(new { message = "Giỏ hàng trống, không thể đặt hàng!" });
            }

            // 2. Tính toán tiền
            decimal totalAmount = cart.CartItems.Sum(item => item.Quantity * item.Product.Price);
            decimal discountAmount = 0;
            decimal shippingFee = totalAmount > 500000 ? 0 : 30000; // Logic ví dụ: Trên 500k freeship
            int? voucherId = null;

            // 3. Xử lý Voucher (Nếu có)
            if (!string.IsNullOrEmpty(request.VoucherCode))
            {
                var voucher = await _context.Vouchers
                    .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

                // Check hạn dùng voucher một lần nữa cho chắc
                var today = DateTime.Now;
                if (voucher != null && voucher.StartDate <= today && voucher.EndDate >= today && voucher.UsageLimit > 0)
                {
                    if (totalAmount >= voucher.MinOrderValue)
                    {
                        if (voucher.DiscountType == "PERCENT")
                            discountAmount = totalAmount * (voucher.DiscountValue / 100);
                        else
                            discountAmount = voucher.DiscountValue;

                        // Không giảm quá tổng tiền
                        if (discountAmount > totalAmount) discountAmount = totalAmount;

                        voucherId = voucher.VoucherId;

                        // Trừ lượt sử dụng voucher (Optional)
                        // voucher.UsageLimit--; 
                    }
                }
            }

            decimal finalAmount = totalAmount + shippingFee - discountAmount;

            // 4. Tạo Order Header
            var order = new Order
            {
                UserId = request.UserId,
                OrderDate = DateTime.Now,
                ReceiverName = request.ReceiverName,
                ReceiverPhone = request.ReceiverPhone,
                ShippingAddress = request.ShippingAddress,
                OrderStatus = "Pending", // Mới đặt thì là Chờ xác nhận
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = "Unpaid",
                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                TotalAmount = finalAmount,
                VoucherId = voucherId
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // Lưu để sinh ra OrderId

            // 5. Chuyển CartItems -> OrderDetails
            foreach (var item in cart.CartItems)
            {
                var detail = new OrderDetail
                {
                    OrderId = order.OrderId,
                    ProductId = item.ProductId,
                    Size = item.Size,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price, // QUAN TRỌNG: Lưu giá tại thời điểm mua
                    TotalPrice = item.Quantity * item.Product.Price
                };
                _context.OrderDetails.Add(detail);
            }

            // 6. Xóa sạch giỏ hàng
            _context.CartItems.RemoveRange(cart.CartItems);

            await _context.SaveChangesAsync(); // Lưu tất cả thay đổi lần cuối

            return Ok(new
            {
                message = "Đặt hàng thành công!",
                orderId = order.OrderId,
                totalAmount = finalAmount
            });
        }

        // API 2: XEM LỊCH SỬ ĐƠN HÀNG
        // GET: api/Orders/user/2
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetOrderHistory(int userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate) // Đơn mới nhất lên đầu
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product) // Để lấy tên sản phẩm hiển thị
                .ThenInclude(p => p.ProductImages) // Lấy ảnh
                .ToListAsync();

            return Ok(orders);
        }

        // API 3: XEM CHI TIẾT 1 ĐƠN HÀNG
        // GET: api/Orders/detail/10
        [HttpGet("detail/{orderId}")]
        public async Task<IActionResult> GetOrderDetail(int orderId)
        {
            var order = await _context.Orders
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .ThenInclude(p => p.ProductImages)
                .FirstOrDefaultAsync(o => o.OrderId == orderId);

            if (order == null) return NotFound();

            return Ok(order);
        }
    }
}
