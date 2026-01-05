using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")] // 🔥 Chỉ Admin mới được xem
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
            // 🔥 LOGIC MỚI: Chỉ tính tổng tiền của các đơn hàng có trạng thái "Completed"
            var totalRevenue = await _context.Orders
                .Where(o => o.OrderStatus == "Completed")
                .SumAsync(o => o.TotalAmount);

            // 2. Tổng số đơn hàng (Đếm tất cả các đơn, trừ đơn Hủy nếu muốn, ở đây tôi đếm tất cả để thấy quy mô)
            var totalOrders = await _context.Orders.CountAsync();

            // 3. Tổng số khách hàng (Role = 'Customer')
            var totalCustomers = await _context.Users.CountAsync(u => u.Role == "Customer");

            // 4. Tổng số sản phẩm
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
        public async Task<IActionResult> GetRevenueChart([FromQuery] DateTime? from, [FromQuery] DateTime? to)
        {
            // 1. Xử lý ngày tháng
            var startDate = from ?? DateTime.Today.AddDays(-30);
            var endDate = to ?? DateTime.Today;

            // Đảm bảo lấy hết ngày cuối cùng (23:59:59)
            endDate = endDate.Date.AddDays(1).AddTicks(-1);

            // 2. Truy vấn dữ liệu biểu đồ
            var rawData = await _context.Orders
                // 🔥 LOGIC MỚI: Lọc theo thời gian VÀ trạng thái phải là "Completed"
                .Where(o => o.OrderDate >= startDate && o.OrderDate <= endDate && o.OrderStatus == "Completed")
                .GroupBy(o => o.OrderDate.Value.Date)
                .Select(g => new
                {
                    Date = g.Key,
                    Revenue = g.Sum(o => o.TotalAmount)
                })
                .OrderBy(x => x.Date)
                .ToListAsync();

            // 3. Format dữ liệu trả về cho React
            var result = rawData.Select(x => new
            {
                date = x.Date.ToString("dd/MM/yyyy"),
                revenue = x.Revenue
            });

            return Ok(result);
        }
    }
}