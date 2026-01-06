using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using BackEnd.DTOs;

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
        // GET: api/Products/subcategories
        // Lấy tất cả danh mục con để Frontend tự lọc
        [HttpGet("subcategories")]
        public async Task<IActionResult> GetAllSubCategories()
        {
            var subs = await _context.SubCategories
                // Cần join bảng CategorySubCategories để biết Sub này thuộc Cha nào
                .SelectMany(s => s.CategorySubCategories.Select(csc => new
                {
                    s.SubCategoryId,
                    s.SubCategoryName,
                    csc.CategoryId // Quan trọng: Để Frontend biết mà lọc
                }))
                .ToListAsync();

            return Ok(subs);
        }
        // PUT: api/Products/update/5
        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] ProductCreateDto model)
        {
            var product = await _context.Products
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductBadges)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null) return NotFound("Không tìm thấy sản phẩm");

            // 1. Update thông tin cơ bản
            product.Title = model.Title;
            product.Price = model.Price;
            product.Description = model.Description;
            product.CategoryId = model.CategoryId;

            // 👇 CẬP NHẬT SỐ LƯỢNG KHO
            product.Quantity = model.Quantity;

            // Nếu là 0 thì phải lưu là null
            product.SubCategoryId = (model.SubCategoryId == 0) ? null : model.SubCategoryId;

            // 2. Xóa dữ liệu cũ (Ảnh, Size, Badge)
            _context.ProductImages.RemoveRange(product.ProductImages);
            _context.ProductSizes.RemoveRange(product.ProductSizes);
            _context.ProductBadges.RemoveRange(product.ProductBadges);

            // 3. Thêm dữ liệu mới

            // Xử lý Ảnh
            if (model.Images != null && model.Images.Count > 0)
            {
                for (int i = 0; i < model.Images.Count; i++)
                {
                    product.ProductImages.Add(new ProductImage
                    {
                        ImageUrl = model.Images[i],
                        IsMain = (i == 0)
                    });
                }
            }

            // Xử lý Size
            if (model.Sizes != null)
            {
                foreach (var s in model.Sizes)
                    product.ProductSizes.Add(new ProductSize { SizeName = s });
            }

            // Xử lý Badge
            if (model.Badges != null)
            {
                foreach (var b in model.Badges)
                    product.ProductBadges.Add(new ProductBadge { BadgeName = b });
            }

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật thành công!" });
            }
            catch (Exception ex)
            {
                return BadRequest("Lỗi cập nhật: " + ex.InnerException?.Message ?? ex.Message);
            }
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
        // POST: api/Products/create
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct([FromBody] ProductCreateDto model)
        {
            if (model == null) return BadRequest("Dữ liệu không hợp lệ");

            // 2. Tạo đối tượng Product chính
            var newProduct = new Product
            {
                Title = model.Title,
                Price = model.Price,
                Description = model.Description,
                CategoryId = model.CategoryId,
                SubCategoryId = (model.SubCategoryId == 0) ? null : model.SubCategoryId,

                // 👇 THÊM SỐ LƯỢNG KHI TẠO MỚI
                Quantity = model.Quantity,

                ProductImages = new List<ProductImage>(),
                ProductSizes = new List<ProductSize>(),
                ProductBadges = new List<ProductBadge>()
            };

            // 3. Xử lý Ảnh
            if (model.Images != null && model.Images.Count > 0)
            {
                foreach (var imgUrl in model.Images)
                {
                    newProduct.ProductImages.Add(new ProductImage
                    {
                        ImageUrl = imgUrl,
                        IsMain = (model.Images.IndexOf(imgUrl) == 0)
                    });
                }
            }

            // 4. Xử lý Size
            if (model.Sizes != null && model.Sizes.Count > 0)
            {
                foreach (var size in model.Sizes)
                {
                    newProduct.ProductSizes.Add(new ProductSize
                    {
                        SizeName = size
                    });
                }
            }

            // 5. Xử lý Badge
            if (model.Badges != null && model.Badges.Count > 0)
            {
                foreach (var badge in model.Badges)
                {
                    newProduct.ProductBadges.Add(new ProductBadge
                    {
                        BadgeName = badge
                    });
                }
            }

            // 6. Lưu vào Database
            try
            {
                _context.Products.Add(newProduct);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Thêm sản phẩm thành công!",
                    productId = newProduct.ProductId
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }
        // GET: api/Products/categories
        // ---------------------------------------------------------
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new
                {
                    c.CategoryId,
                    c.CategoryName,
                    c.CategoryCode
                })
                .ToListAsync();

            return Ok(categories);
        }
    }
   
}
