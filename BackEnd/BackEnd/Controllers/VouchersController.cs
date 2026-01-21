using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using BackEnd.DTOs;

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

        // ==========================================
        // PHẦN 1: API PUBLIC (DÀNH CHO KHÁCH HÀNG)
        // ==========================================

        // API: Kiểm tra mã giảm giá (Khi nhập ở Checkout)
        // GET: api/Vouchers/check?code=WELCOME&orderTotal=500000
        [HttpGet("check")]
        public async Task<IActionResult> CheckVoucher(string code, decimal orderTotal)
        {
            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Code == code && v.IsActive == true);

            // 1. Kiểm tra tồn tại
            if (voucher == null) return BadRequest(new { message = "Mã giảm giá không tồn tại hoặc đã bị khóa!" });

            // 2. Kiểm tra ngày hết hạn
            var today = DateTime.Now;
            if (voucher.StartDate > today || voucher.EndDate < today)
                return BadRequest(new { message = "Mã giảm giá chưa đến đợt hoặc đã hết hạn!" });

            // 3. Kiểm tra số lượng
            if (voucher.UsageLimit <= 0)
                return BadRequest(new { message = "Mã giảm giá đã hết lượt sử dụng!" });

            // 4. Kiểm tra giá trị đơn hàng tối thiểu
            if (orderTotal < voucher.MinOrderValue)
            {
                var minVal = voucher.MinOrderValue?.ToString("N0") ?? "0";
                return BadRequest(new { message = $"Đơn hàng phải từ {minVal}đ mới được dùng mã này!" });
            }

            // 5. Tính toán số tiền được giảm
            decimal discountAmount = 0;
            if (voucher.DiscountType == "PERCENT")
                discountAmount = orderTotal * (voucher.DiscountValue / 100);
            else
                discountAmount = voucher.DiscountValue;

            if (discountAmount > orderTotal) discountAmount = orderTotal;

            return Ok(new
            {
                message = "Áp dụng mã thành công!",
                discountAmount = discountAmount,
                code = voucher.Code
            });
        }

        // API: Lấy danh sách Voucher khả dụng (Hiển thị ở Trang chủ)
        // GET: api/Vouchers/available
        [HttpGet("available")] 
        public async Task<IActionResult> GetAvailableVouchers()
        {
            var today = DateTime.Now;

            var vouchers = await _context.Vouchers
                .Where(v => v.IsActive == true
                         && v.StartDate <= today
                         && v.EndDate >= today
                         && v.UsageLimit > 0)
                .Select(v => new
                {
                    v.VoucherId,
                    v.Code,
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

        // ==========================================
        // PHẦN 2: API ADMIN (QUẢN LÝ CRUD)
        // ==========================================

        // 1. LẤY TẤT CẢ VOUCHER
        // GET: api/Vouchers
        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllVouchers()
        {
            var list = await _context.Vouchers
                .OrderByDescending(v => v.VoucherId)
                .ToListAsync();
            return Ok(list);
        }

        // 2. TẠO VOUCHER MỚI
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateVoucher([FromBody] VoucherDto model)
        {
            if (await _context.Vouchers.AnyAsync(v => v.Code == model.Code))
                return BadRequest(new { message = "Mã Voucher này đã tồn tại!" });

            var voucher = new Voucher
            {
                Code = model.Code.ToUpper(),
                DiscountType = model.DiscountType,
                DiscountValue = model.DiscountValue,
                MinOrderValue = model.MinOrderValue,
                StartDate = model.StartDate,
                EndDate = model.EndDate,
                UsageLimit = model.UsageLimit,
                IsActive = true
            };

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo Voucher thành công", voucher });
        }

        // 3. CẬP NHẬT VOUCHER
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateVoucher(int id, [FromBody] VoucherDto model)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return NotFound(new { message = "Không tìm thấy Voucher" });

            if (voucher.Code != model.Code && await _context.Vouchers.AnyAsync(v => v.Code == model.Code))
                return BadRequest(new { message = "Mã Voucher mới đã bị trùng!" });

            voucher.Code = model.Code.ToUpper();
            voucher.DiscountType = model.DiscountType;
            voucher.DiscountValue = model.DiscountValue;
            voucher.MinOrderValue = model.MinOrderValue;
            voucher.StartDate = model.StartDate;
            voucher.EndDate = model.EndDate;
            voucher.UsageLimit = model.UsageLimit;
            voucher.IsActive = model.IsActive;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        // 4. XÓA VOUCHER
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteVoucher(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return NotFound();

            _context.Vouchers.Remove(voucher);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa Voucher" });
        }
    }

    
}