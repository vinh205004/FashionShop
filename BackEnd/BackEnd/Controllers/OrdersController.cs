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
                return BadRequest(new { message = "Giỏ hàng trống, không thể đặt hàng!" });

            var itemsToBuy = cart.CartItems.ToList();
            if (request.SelectedProductIds != null && request.SelectedProductIds.Any())
            {
                itemsToBuy = cart.CartItems
                    .Where(ci => request.SelectedProductIds.Contains(ci.ProductId))
                    .ToList();
            }

            if (!itemsToBuy.Any())
                return BadRequest(new { message = "Vui lòng chọn ít nhất một sản phẩm để thanh toán!" });

            // Validate số lượng tồn kho ngay khi đặt
            foreach (var item in itemsToBuy)
            {
                if (item.Product.Quantity < item.Quantity)
                {
                    return BadRequest(new { message = $"Sản phẩm '{item.Product.Title}' không đủ hàng (Còn: {item.Product.Quantity})" });
                }
            }

            // 2. Tính toán tiền
            decimal totalAmount = itemsToBuy.Sum(item => item.Quantity * item.Product.Price);
            decimal discountAmount = 0;
            decimal shippingFee = totalAmount > 500000 ? 0 : 30000;
            int? voucherId = null;

            // Xử lý Voucher
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

                        if (discountAmount > totalAmount) discountAmount = totalAmount;
                        voucherId = voucher.VoucherId;
                        voucher.UsageLimit -= 1;
                    }
                }
            }

            decimal finalAmount = totalAmount + shippingFee - discountAmount;

            // 3. Tạo Order Header
            var order = new Order
            {
                UserId = request.UserId,
                OrderDate = DateTime.Now,
                ReceiverName = request.ReceiverName,
                ReceiverPhone = request.ReceiverPhone,
                ShippingAddress = request.ShippingAddress,
                OrderStatus = "Pending", // Mới tạo là Pending
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = "Unpaid",
                ShippingFee = shippingFee,
                DiscountAmount = discountAmount,
                TotalAmount = finalAmount,
                VoucherId = voucherId
            };

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

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

            // 5. Xóa sản phẩm đã mua khỏi giỏ hàng
            _context.CartItems.RemoveRange(itemsToBuy);
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
        // PHẦN 2: API DÀNH CHO ADMIN & XỬ LÝ KHO
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
                    o.OrderStatus,
                    o.PaymentMethod,
                    o.PaymentStatus,
                    CustomerName = o.ReceiverName ?? o.User.FullName,
                    CustomerPhone = o.ReceiverPhone ?? o.User.PhoneNumber
                })
                .ToListAsync();

            return Ok(orders);
        }

        // CẬP NHẬT TRẠNG THÁI & TRỪ/CỘNG KHO 
        [HttpPut("status/{id}")]
        [Authorize(Roles = "Admin,Customer")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateStatusDto model)
        {
            Console.WriteLine($"--- DEBUG UpdateOrderStatus: OrderId = {id}, NewStatus = {model.Status} ---");
            var order = await _context.Orders
                .Include(o => o.OrderDetails) // Lấy chi tiết đơn
                .FirstOrDefaultAsync(o => o.OrderId == id);

            if (order == null) return NotFound("Không tìm thấy đơn hàng");

            string oldStatus = order.OrderStatus;
            string newStatus = model.Status;

            if (oldStatus == "Cancelled") return BadRequest("Đơn hàng đã hủy, không thể thay đổi!");
            if (oldStatus == "Completed") return BadRequest("Đơn hàng đã hoàn thành!");

            // ==========================================
            // LOGIC: DUYỆT ĐƠN (Pending -> Confirmed) => TRỪ KHO
            // ==========================================
            if (oldStatus == "Pending" && newStatus == "Confirmed")
            {
                foreach (var item in order.OrderDetails)
                {
                    // Lấy sản phẩm từ DB ra để trừ
                    var product = await _context.Products.FindAsync(item.ProductId);
                    if (product != null)
                    {
                        // Kiểm tra tồn kho
                        if (product.Quantity < item.Quantity)
                        {
                            return BadRequest(new { message = $"Sản phẩm '{product.Title}' không đủ hàng (Còn: {product.Quantity})" });
                        }
                        // Trừ
                        product.Quantity -= item.Quantity;
                        _context.Products.Update(product); // Đánh dấu update
                    }
                }
            }

            // ==========================================
            // LOGIC: HỦY ĐƠN (Cancelled) => HOÀN KHO
            // ==========================================
            else if (newStatus == "Cancelled")
            {
                // Chỉ hoàn kho nếu đơn đã từng được duyệt (đã trừ)
                if (oldStatus == "Confirmed" || oldStatus == "Shipping")
                {
                    foreach (var item in order.OrderDetails)
                    {
                        var product = await _context.Products.FindAsync(item.ProductId);
                        if (product != null)
                        {
                            product.Quantity += item.Quantity;
                            _context.Products.Update(product); // Đánh dấu update
                        }
                    }
                }
            }

            // Cập nhật trạng thái đơn
            order.OrderStatus = newStatus;

            // Nếu giao xong mà chưa trả tiền -> Set thành Paid
            if (newStatus == "Completed" && order.PaymentStatus == "Unpaid")
            {
                order.PaymentStatus = "Paid";
            }

            try
            {
                await _context.SaveChangesAsync(); // Lưu tất cả thay đổi (Order + Product)
                return Ok(new { message = $"Thành công: {newStatus}" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi Database: " + ex.Message });
            }
        }
    }

    // DTO Helper
    public class UpdateStatusDto
    {
        public string Status { get; set; } // Confirmed, Shipping, Completed, Cancelled
    }
}