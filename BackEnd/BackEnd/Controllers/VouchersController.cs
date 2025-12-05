using BackEnd.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class VouchersController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public VouchersController(FashionShopDbContext context)
        {
            _context = context;
        }

        // API: Kiểm tra mã giảm giá
        // GET: api/Vouchers/check?code=WELCOME&orderTotal=500000
        [HttpGet("check")]
        public async Task<IActionResult> CheckVoucher(string code, decimal orderTotal)
        {
            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Code == code && v.IsActive == true);

            // 1. Kiểm tra tồn tại
            if (voucher == null)
            {
                return BadRequest(new { message = "Mã giảm giá không tồn tại hoặc đã bị khóa!" });
            }

            // 2. Kiểm tra ngày hết hạn
            var today = DateTime.Now;
            if (voucher.StartDate > today || voucher.EndDate < today)
            {
                return BadRequest(new { message = "Mã giảm giá chưa đến đợt hoặc đã hết hạn!" });
            }

            // 3. Kiểm tra số lượng
            if (voucher.UsageLimit <= 0)
            {
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng!" });
            }

            // 4. Kiểm tra giá trị đơn hàng tối thiểu
            if (orderTotal < voucher.MinOrderValue)
            {
                // Format tiền việt cho đẹp
                var minVal = voucher.MinOrderValue?.ToString("N0") ?? "0";
                return BadRequest(new { message = $"Đơn hàng phải từ {minVal}đ mới được dùng mã này!" });
            }

            // 5. Tính toán số tiền được giảm
            decimal discountAmount = 0;

            if (voucher.DiscountType == "PERCENT")
            {
                // Giảm theo % (Ví dụ giảm 10%)
                discountAmount = orderTotal * (voucher.DiscountValue / 100);
            }
            else
            {
                // Giảm tiền mặt (Ví dụ giảm 50k)
                discountAmount = voucher.DiscountValue;
            }

            // Đảm bảo không giảm quá số tiền đơn hàng (tránh âm tiền)
            if (discountAmount > orderTotal) discountAmount = orderTotal;

            return Ok(new
            {
                message = "Áp dụng mã thành công!",
                discountAmount = discountAmount,
                code = voucher.Code
            });
        }
        // API: Lấy danh sách Voucher khả dụng
        // GET: api/Vouchers
        [HttpGet]
        public async Task<IActionResult> GetVouchers()
        {
            var today = DateTime.Now;

            // Lấy các voucher: Đang hoạt động + Còn hạn + Còn lượt dùng
            var vouchers = await _context.Vouchers
                .Where(v => v.IsActive == true
                         && v.StartDate <= today
                         && v.EndDate >= today
                         && v.UsageLimit > 0)
                .Select(v => new
                {
                    v.VoucherId,
                    v.Code,
                    // Tự tạo tiêu đề đẹp để hiện lên App
                    Title = v.DiscountType == "PERCENT" ? $"Giảm {v.DiscountValue:N0}%" : $"Giảm {v.DiscountValue:N0}đ",
                    Description = v.MinOrderValue > 0 ? $"Đơn tối thiểu {v.MinOrderValue:N0}đ" : "Áp dụng cho mọi đơn hàng",
                    v.MinOrderValue,
                    v.DiscountValue,
                    v.DiscountType,
                    ExpiredAt = v.EndDate
                })
                .ToListAsync();

            return Ok(vouchers);
        }
    }
}
