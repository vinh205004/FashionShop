using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;
using BCrypt.Net;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly FashionShopDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(FashionShopDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // HÀM PHỤ: TẠO JWT TOKEN
        private string CreateToken(User user)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

            var claims = new List<Claim>
            {
                // 👇 QUAN TRỌNG: 2 Dòng này giúp API Hủy Đơn lấy được ID người dùng
                // Đừng dùng ClaimTypes.NameIdentifier vì .NET hay tự đổi tên nó
                new Claim("UserId", user.UserId.ToString()),

                new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
                new Claim(ClaimTypes.Name, user.Username),
                new Claim(ClaimTypes.Role, user.Role ?? "Customer")
            };

            var creds = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: jwtSettings["Issuer"],
                audience: jwtSettings["Audience"],
                claims: claims,
                expires: DateTime.Now.AddDays(7),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        // API 1: ĐĂNG KÝ
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Username == request.Username))
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại!" });

            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return BadRequest(new { message = "Email này đã được sử dụng!" });

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var user = new User
            {
                Username = request.Username,
                PasswordHash = passwordHash,
                FullName = request.FullName,
                Email = request.Email,
                PhoneNumber = request.Phone,
                Role = "Customer",
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Tự động tạo Giỏ hàng rỗng cho người dùng mới
            var cart = new Cart { UserId = user.UserId };
            _context.Carts.Add(cart);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đăng ký thành công!" });
        }

        // API 2: ĐĂNG NHẬP
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            if (user == null)
                return BadRequest(new { message = "Sai tên đăng nhập hoặc mật khẩu" });

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);

            if (!isPasswordValid)
                return BadRequest(new { message = "Sai tên đăng nhập hoặc mật khẩu" });

            //  TẠO TOKEN
            string token = CreateToken(user);

            // TRẢ VỀ FULL THÔNG TIN
            return Ok(new
            {
                message = "Đăng nhập thành công",
                token = token,
                userId = user.UserId,
                fullName = user.FullName,
                role = user.Role,
                email = user.Email,
                phone = user.PhoneNumber,
                address = user.Address
            });
        }

        // API 3: CẬP NHẬT THÔNG TIN CÁ NHÂN
        [HttpPut("profile/{userId}")]
        public async Task<IActionResult> UpdateProfile(int userId, [FromBody] UpdateProfileRequest request)
        {
            var user = await _context.Users.FindAsync(userId);

            if (user == null) return NotFound(new { message = "Không tìm thấy người dùng" });

            // Cập nhật thông tin
            user.FullName = request.FullName;
            user.PhoneNumber = request.PhoneNumber;
            user.Address = request.Address;

            await _context.SaveChangesAsync();

            // Trả về thông tin mới để Frontend cập nhật lại LocalStorage
            return Ok(new
            {
                message = "Cập nhật thành công",
                userId = user.UserId,
                fullName = user.FullName,
                role = user.Role,
                email = user.Email,
                phone = user.PhoneNumber,
                address = user.Address
            });
        }
    }

    // DTOs (Request Models)
    public class RegisterRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

}