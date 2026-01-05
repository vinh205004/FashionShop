using BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.DTOs;

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

        // =================================================================
        // PHẦN 1: API DÀNH CHO KHÁCH HÀNG (CLIENT)
        // =================================================================

        // API 1: TẠO ĐƠN HÀNG (CHECKOUT)
        [HttpPost("create")]
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequest request)
        {
            // 1. Lấy giỏ hàng của User
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId);

            if (cart == null || !cart.CartItems.Any())
            {
                return BadRequest(new { message = "Giỏ hàng trống, không thể đặt hàng!" });
            }
            var itemsToBuy = cart.CartItems.ToList();
            if (request.SelectedProductIds != null && request.SelectedProductIds.Any())
            {
                itemsToBuy = cart.CartItems
                    .Where(ci => request.SelectedProductIds.Contains(ci.ProductId))
                    .ToList();
            }

            if (!itemsToBuy.Any())
            {
                return BadRequest(new { message = "Vui lòng chọn ít nhất một sản phẩm để thanh toán!" });
            }
            // 2. Tính toán tiền
            decimal totalAmount = cart.CartItems.Sum(item => item.Quantity * item.Product.Price);
            decimal discountAmount = 0;
            decimal shippingFee = totalAmount > 500000 ? 0 : 30000; // Trên 500k freeship
            int? voucherId = null;

            // Xử lý Voucher (Nếu có)
            if (!string.IsNullOrEmpty(request.VoucherCode))
            {
                var voucher = await _context.Vouchers
                    .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

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
                    }
                }
            }

            decimal finalAmount = totalAmount + shippingFee - discountAmount;

            // --- XỬ LÝ TRẠNG THÁI THANH TOÁN ---
            // Chuẩn hóa chuỗi phương thức thanh toán
            string paymentMethodUpper = request.PaymentMethod.ToUpper();
            string paymentStatus = "Unpaid";

            // Chỉ khi thanh toán Online thì mới set là Paid ngay lúc tạo
            if (paymentMethodUpper == "VNPAY" || paymentMethodUpper == "MOMO" || paymentMethodUpper == "BANKING")
            {
                paymentStatus = "Unpaid";
            }
            else
            {
                paymentStatus = "Unpaid"; // COD hoặc Cash
            }

            // 3. Tạo Order Header
            var order = new Order
            {
                UserId = request.UserId,
                OrderDate = DateTime.Now,
                ReceiverName = request.ReceiverName,
                ReceiverPhone = request.ReceiverPhone,
                ShippingAddress = request.ShippingAddress,

                // Luôn là Pending để chờ Admin duyệt tìm Shipper
                OrderStatus = "Pending",

                PaymentMethod = request.PaymentMethod,
                PaymentStatus = paymentStatus, // Sử dụng biến đã xử lý ở trên

                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                TotalAmount = finalAmount,
                VoucherId = voucherId
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync(); // Lưu để sinh OrderId

            // 4. Lưu chi tiết đơn hàng
            foreach (var item in itemsToBuy)
            {
                _context.OrderDetails.Add(new OrderDetail
                {
                    OrderId = order.OrderId,
                    ProductId = item.ProductId,
                    Size = item.Size,
                    Quantity = item.Quantity,
                    UnitPrice = item.Product.Price,
                    TotalPrice = item.Quantity * item.Product.Price
                });
            }

            // 5. Xóa sạch giỏ hàng
            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đặt hàng thành công!",
                orderId = order.OrderId,
                totalAmount = finalAmount
            });
        }

        // API 2: XEM LỊCH SỬ ĐƠN HÀNG
        [HttpGet("user/{userId}")]
        public async Task<IActionResult> GetOrderHistory(int userId)
        {
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .OrderByDescending(o => o.OrderDate)
                .Include(o => o.OrderDetails)
                .ThenInclude(od => od.Product)
                .ThenInclude(p => p.ProductImages)
                .ToListAsync();

            return Ok(orders);
        }

        // API 3: XEM CHI TIẾT 1 ĐƠN HÀNG
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

        // =================================================================
        // PHẦN 2: API DÀNH CHO ADMIN
        // =================================================================

        // API 4: LẤY TẤT CẢ ĐƠN HÀNG (ADMIN)
        [HttpGet("admin")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllOrders()
        {
            var orders = await _context.Orders
                .Include(o => o.User)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.OrderId,
                    o.OrderDate,
                    o.TotalAmount,
                    o.OrderStatus, // Pending, Confirmed, Cancelled...
                    o.PaymentMethod,
                    o.PaymentStatus,
                    CustomerName = o.ReceiverName ?? o.User.FullName,
                    CustomerPhone = o.ReceiverPhone ?? o.User.PhoneNumber
                })
                .ToListAsync();

            return Ok(orders);
        }

        // API 5: CẬP NHẬT TRẠNG THÁI (DUYỆT/HỦY/HOÀN THÀNH)
        [HttpPut("status/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusDto model)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            // Cập nhật trạng thái
            order.OrderStatus = model.Status;

            // 🔥 LOGIC ECOSYSTEM: Tự động cập nhật thanh toán khi giao thành công
            // Nếu đơn hàng chuyển sang trạng thái "Completed" (Shipper giao xong)
            // VÀ đang là Unpaid (COD) -> Chuyển thành Paid
            if (model.Status == "Completed" && order.PaymentStatus == "Unpaid")
            {
                order.PaymentStatus = "Paid";
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã cập nhật trạng thái thành: {model.Status}" });
        }
        // API 6: KHÁCH HÀNG TỰ HỦY ĐƠN
        // PUT: api/Orders/cancel/5
        [HttpPut("cancel/{id}")]
        [Authorize] // Bắt buộc phải đăng nhập (nhưng không cần là Admin)
        public async Task<IActionResult> CancelOrderByUser(int id)
        {
            // 1. Lấy ID người dùng hiện tại từ Token
            // (Đảm bảo Claim "UserId" khớp với lúc bạn tạo Token khi Login)
            var userIdClaim = User.FindFirst("UserId");
            if (userIdClaim == null)
            {
                return Unauthorized("Không xác định được danh tính người dùng.");
            }
            int currentUserId = int.Parse(userIdClaim.Value);

            // 2. Tìm đơn hàng
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                return NotFound("Không tìm thấy đơn hàng.");
            }

            // 3. KIỂM TRA QUYỀN SỞ HỮU
            // Nếu người đang gọi API không phải chủ đơn hàng -> Chặn ngay
            if (order.UserId != currentUserId)
            {
                return Forbid("Bạn không có quyền hủy đơn hàng của người khác!");
            }

            // 4. KIỂM TRA TRẠNG THÁI ĐƠN
            // Chỉ cho phép hủy khi đơn còn đang "Pending" (Chờ duyệt)
            if (order.OrderStatus != "Pending")
            {
                return BadRequest("Đơn hàng đã được duyệt hoặc đang giao, không thể hủy!");
            }

            // 5. Thực hiện hủy
            order.OrderStatus = "Cancelled";

            // (Optional) Nếu đơn đã thanh toán online (Paid) thì cần lưu log để Admin hoàn tiền
            // if (order.PaymentStatus == "Paid") { ... }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Hủy đơn hàng thành công!" });
        }
    }


   
}