using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // 🔥 Chỉ Admin mới được gọi
    public class DashboardController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public DashboardController(FashionShopDbContext context)
        {
            _context = context;
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            // 1. Tổng doanh thu 
            var totalRevenue = await _context.Orders
        .Where(o => o.PaymentStatus == "Paid") 
        .SumAsync(o => o.TotalAmount);

            // 2. Tổng số đơn hàng (Trong DB mẫu đang có 1 đơn)
            var totalOrders = await _context.Orders.CountAsync();

            // 3. Tổng số khách hàng (Role = 'Customer')
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");

            // 4. Tổng số sản phẩm (Trong DB mẫu có 8 sản phẩm)
            var totalProducts = await _context.Products.CountAsync();

            return Ok(new
            {
                revenue = totalRevenue,
                orders = totalOrders,
                customers = totalCustomers,
                products = totalProducts
            });
        }
        [HttpGet("chart")]
        // Thêm 2 tham số [FromQuery] để nhận từ URL (ví dụ: ?from=2024-01-01&to=2024-01-31)
        public async Task<IActionResult> GetRevenueChart([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            // 1. Xử lý ngày tháng
            // Nếu không truyền 'from', mặc định lấy 30 ngày trước
            var startDate = from ?? DateTime.Today.AddDays(-30);
            // Nếu không truyền 'to', mặc định lấy hôm nay
            var endDate = to ?? DateTime.Today;

            // Đảm bảo endDate bao gồm cả giây cuối cùng của ngày (23:59:59)
            endDate = endDate.Date.AddDays(1).AddTicks(-1);

            var rawData = await _context.Orders
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.PaymentStatus == "Paid")
                .GroupBy(o => o.OrderDate.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            var result = rawData.Select(x => new
            {
                // Trả về format ngày/tháng/năm để hiển thị đẹp trên biểu đồ
                date = x.Date.ToString("dd/MM/yyyy"),
                revenue = x.Revenue
            });

            return Ok(result);
        }
    }
}