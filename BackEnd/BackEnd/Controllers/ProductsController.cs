using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public ProductsController(FashionShopDbContext context)
        {
            _context = context;
        }

        // GET: api/Products?category=nu&minPrice=100000&maxPrice=500000&sort=price-asc&page=1
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? sizes = null,
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? subCategory = null,
            [FromQuery] decimal? minPrice = null,    // <--- Mới: Giá thấp nhất
            [FromQuery] decimal? maxPrice = null,    // <--- Mới: Giá cao nhất
            [FromQuery] string? sort = null,         // <--- Mới: Kiểu sắp xếp
            [FromQuery] int? limit = null,
            [FromQuery] bool random = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12
        )
        {
            // 1. Khởi tạo truy vấn
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductBadges)
                .AsQueryable();
            if (!string.IsNullOrEmpty(search))
            {
               
                query = query.Where(p => p.Title.Contains(search)
                                      || p.Category.CategoryName.Contains(search)
                                      || p.SubCategory.SubCategoryName.Contains(search));
            }
            // 2. Lọc theo Danh mục
            if (!string.IsNullOrEmpty(category))
                query = query.Where(p => p.Category.CategoryCode == category); // Lọc theo Code (nu, nam)

            if (!string.IsNullOrEmpty(subCategory))
                query = query.Where(p => p.SubCategory.SubCategoryCode == subCategory); // Lọc theo Code (ao-thun)
            // --- 2. LOGIC LỌC SIZE (MỚI) ---
            if (!string.IsNullOrEmpty(sizes))
            {
                // Tách chuỗi "S,M,L" thành mảng ["S", "M", "L"]
                var sizeList = sizes.Split(',').Select(s => s.Trim()).ToList();

                // Lọc sản phẩm nào CÓ CHỨA ít nhất 1 size trong danh sách chọn
                query = query.Where(p => p.ProductSizes.Any(ps => sizeList.Contains(ps.SizeName)));
            }
            // 3. Lọc theo GIÁ TIỀN (MỚI)
            if (minPrice.HasValue)
                query = query.Where(p => p.Price >= minPrice.Value);

            if (maxPrice.HasValue)
                query = query.Where(p => p.Price <= maxPrice.Value);

            // 4. Đếm tổng số lượng (Trước khi cắt trang)
            int totalCount = await query.CountAsync();

            // 5. Sắp xếp (MỚI & QUAN TRỌNG)
            if (random)
            {
                query = query.OrderBy(x => Guid.NewGuid());
            }
            else if (!string.IsNullOrEmpty(sort))
            {
                switch (sort.ToLower())
                {
                    case "price-asc": // Giá tăng dần
                        query = query.OrderBy(p => p.Price);
                        break;
                    case "price-desc": // Giá giảm dần
                        query = query.OrderByDescending(p => p.Price);
                        break;
                    case "name-asc": // Tên A-Z
                        query = query.OrderBy(p => p.Title);
                        break;
                    case "name-desc": // Tên Z-A
                        query = query.OrderByDescending(p => p.Title);
                        break;
                    case "newest": // Mới nhất
                        query = query.OrderByDescending(p => p.ProductId);
                        break;
                    default: // Mặc định
                        query = query.OrderByDescending(p => p.ProductId);
                        break;
                }
            }
            else
            {
                // Mặc định nếu không chọn gì thì lấy mới nhất
                query = query.OrderByDescending(p => p.ProductId);
            }

            // 6. Xử lý limit (nếu lấy top sản phẩm) vs pageSize
            int actualSize = limit.HasValue ? limit.Value : pageSize;

            // 7. Phân trang & Lấy dữ liệu
            var products = await query
                .Skip((page - 1) * actualSize)
                .Take(actualSize)
                .ToListAsync();

            return Ok(new
            {
                Data = products,
                Total = totalCount,
                Page = page,
                PageSize = actualSize
            });

        }

        // GET: api/Products/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Product>> GetProduct(int id)
        {
            var product = await _context.Products
                .Include(p => p.Category)      // Nối bảng Category
                .Include(p => p.SubCategory)   // Nối bảng SubCategory
                .Include(p => p.ProductImages) // Lấy ảnh
                .Include(p => p.ProductSizes)  // Lấy size
                .Include(p => p.ProductBadges) // Lấy badge
                .FirstOrDefaultAsync(p => p.ProductId == id); 

            if (product == null)
            {
                return NotFound();
            }

            return product;
        }

        // PUT: api/Products/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProduct(int id, Product product)
        {
            if (id != product.ProductId)
            {
                return BadRequest();
            }

            _context.Entry(product).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Products
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(Product product)
        {
            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetProduct", new { id = product.ProductId }, product);
        }

        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductExists(int id)
        {
            return _context.Products.Any(e => e.ProductId == id);
        }
        // API: Lấy danh sách tất cả các Size có trong hệ thống (để hiện bộ lọc)
        // GET: api/Products/sizes
        [HttpGet("sizes")]
        public async Task<IActionResult> GetUniqueSizes()
        {
            // Lấy distinct (không trùng lặp) tên size từ bảng ProductSizes
            var sizes = await _context.ProductSizes
                .Select(s => s.SizeName)
                .Distinct()
                .ToListAsync();

            return Ok(sizes);
        }
    }
}
