using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize(Roles = "Admin")]
    public class UsersController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public UsersController(FashionShopDbContext context)
        {
            _context = context;
        }

        // 1. LẤY TẤT CẢ USER (Trừ password)
        [HttpGet]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.UserId,
                    u.FullName,
                    u.Username,
                    u.Email,
                    u.PhoneNumber,
                    u.Role,
                    u.Address,
                    u.CreatedAt
                })
                .OrderByDescending(u => u.CreatedAt)
                .ToListAsync();

            return Ok(users);
        }

        // 2. XÓA USER
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });
            var currentUserId = int.Parse(User.FindFirst("UserId").Value);
            if (user.UserId == currentUserId) return BadRequest("Không thể tự xóa chính mình!");
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa người dùng thành công" });
        }

        // 3. THĂNG CẤP LÊN ADMIN
        [HttpPut("promote/{id}")]
        public async Task<IActionResult> PromoteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            if (user.Role == "Admin")
                return BadRequest(new { message = "Người này đã là Admin rồi!" });

            user.Role = "Admin"; // Cập nhật Role
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Đã thăng cấp {user.FullName} lên Admin!" });
        }
    }
}