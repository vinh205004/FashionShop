using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BackEnd.Models;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public CartsController(FashionShopDbContext context)
        {
            _context = context;
        }

        // 1. API: Lấy giỏ hàng của User
        // GET: api/Carts/5 (5 là UserId)
        [HttpGet("{userId}")]
        public async Task<IActionResult> GetCart(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product) // Lấy luôn thông tin sản phẩm (Tên, Giá, Ảnh)
                .ThenInclude(p => p.ProductImages) // Lấy ảnh để hiện
                .Include(c => c.CartItems)
                .ThenInclude(ci => ci.Product)
                .ThenInclude(p => p.ProductSizes)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return Ok(new { items = new List<object>() });

            return Ok(cart);
        }

        // 2. API: Thêm vào giỏ 
        // POST: api/Carts/add
        [HttpPost("add")]
        public async Task<IActionResult> AddToCart([FromBody] AddToCartRequest request)
        {
            // Tìm xem User này đã có giỏ hàng chưa?
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == request.UserId);

            // Chưa có thì tạo giỏ mới
            if (cart == null)
            {
                cart = new Cart { UserId = request.UserId, CreatedAt = DateTime.Now };
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync(); // Lưu để lấy CartId
            }

            // Kiểm tra xem sản phẩm + size này đã có trong giỏ chưa?
            var existingItem = cart.CartItems
                .FirstOrDefault(i => i.ProductId == request.ProductId && i.Size == request.Size);

            if (existingItem != null)
            {
                // Có rồi -> Cộng dồn số lượng
                existingItem.Quantity += request.Quantity;
                existingItem.AddedAt = DateTime.Now;
            }
            else
            {
                // Chưa có -> Thêm dòng mới
                var newItem = new CartItem
                {
                    CartId = cart.CartId,
                    ProductId = request.ProductId,
                    Quantity = request.Quantity,
                    Size = request.Size,
                    AddedAt = DateTime.Now
                };
                _context.CartItems.Add(newItem);
            }

            // Lưu tất cả xuống SQL
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã thêm vào giỏ hàng thành công!" });
        }

        // 3. API: Xóa sản phẩm khỏi giỏ
        // DELETE: api/Carts/remove/12 (12 là CartItemId)
        [HttpDelete("remove/{cartItemId}")]
        public async Task<IActionResult> RemoveItem(int cartItemId)
        {
            var item = await _context.CartItems.FindAsync(cartItemId);
            if (item == null) return NotFound();

            _context.CartItems.Remove(item);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa sản phẩm" });
        }
        // API 4: CẬP NHẬT GIỎ HÀNG 
        // PUT: api/Carts/update
        [HttpPut("update")]
        public async Task<IActionResult> UpdateCartItem([FromBody] UpdateCartRequest request)
        {
            // 1. Tìm chính xác dòng sản phẩm trong giỏ bằng ID riêng của nó (CartItemId)
            var item = await _context.CartItems.FindAsync(request.CartItemId);

            if (item == null)
            {
                return NotFound(new { message = "Sản phẩm không tồn tại trong giỏ hàng" });
            }

            // 2. Cập nhật số lượng (nếu có gửi lên)
            if (request.Quantity > 0)
            {
                item.Quantity = request.Quantity;
            }

            // 3. Cập nhật Size (nếu có gửi lên)
            if (request.Size != null)
            {
                item.Size = request.Size;
            }

            // 4. Cập nhật thời gian để biết dòng này mới được sửa
            item.AddedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Cập nhật thành công" });
        }
        // API 5: XÓA TOÀN BỘ GIỎ HÀNG
        // DELETE: api/Carts/clear/2 (2 là UserId)
        [HttpDelete("clear/{userId}")]
        public async Task<IActionResult> ClearCart(int userId)
        {
            var cart = await _context.Carts
                .Include(c => c.CartItems)
                .FirstOrDefaultAsync(c => c.UserId == userId);

            if (cart == null) return NotFound("Giỏ hàng không tồn tại");

            // Xóa hết các dòng trong CartItems của giỏ này
            _context.CartItems.RemoveRange(cart.CartItems);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa sạch giỏ hàng" });
        }
    }
}
