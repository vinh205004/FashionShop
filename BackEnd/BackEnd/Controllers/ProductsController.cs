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
using BackEnd.Services;


namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductsController : ControllerBase
    {
        private readonly FashionShopDbContext _context;
        private readonly ICloudinaryService _cloudinaryService;

        // =================================================================
        // 1. CONSTRUCTOR
        // =================================================================
        public ProductsController(FashionShopDbContext context, ICloudinaryService cloudinaryService)
        {
            _context = context;
            _cloudinaryService = cloudinaryService;
        }

        // =================================================================
        // 2. CÁC API LẤY DỮ LIỆU (PUBLIC)
        // =================================================================

        // GET: api/Products (Lọc, Tìm kiếm, Phân trang, Sắp xếp)
        [HttpGet]
        public async Task<IActionResult> GetProducts(
            [FromQuery] string? sizes = null,
            [FromQuery] string? search = null,
            [FromQuery] string? category = null,
            [FromQuery] string? subCategory = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
            [FromQuery] string? sort = null,
            [FromQuery] int? limit = null,
            [FromQuery] bool random = false,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 12
        )
        {
            var query = _context.Products
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductBadges)
                .Where(p => p.IsActive == true)
                .AsQueryable();

            // 1. Tìm kiếm
            if (!string.IsNullOrEmpty(search))
            {
                // Chuyển về chữ thường để tìm kiếm không phân biệt hoa thường (Postgres cần cẩn thận cái này)
                string searchLower = search.ToLower();
                query = query.Where(p => p.Title.ToLower().Contains(searchLower)
                                      || p.Category.CategoryName.ToLower().Contains(searchLower)
                                      || p.SubCategory.SubCategoryName.ToLower().Contains(searchLower));
            }

            // 2. Lọc Danh mục
            if (!string.IsNullOrEmpty(category))
                query = query.Where(p => p.Category.CategoryCode == category);

            if (!string.IsNullOrEmpty(subCategory))
                query = query.Where(p => p.SubCategory.SubCategoryCode == subCategory);

            // 3. Lọc Size
            if (!string.IsNullOrEmpty(sizes))
            {
                var sizeList = sizes.Split(',').Select(s => s.Trim()).ToList();
                query = query.Where(p => p.ProductSizes.Any(ps => sizeList.Contains(ps.SizeName)));
            }

            // 4. Lọc Giá
            if (minPrice.HasValue) query = query.Where(p => p.Price >= minPrice.Value);
            if (maxPrice.HasValue) query = query.Where(p => p.Price <= maxPrice.Value);

            int totalCount = await query.CountAsync();

            // 5. Sắp xếp
            if (random)
            {
                query = query.OrderBy(x => Guid.NewGuid());
            }
            else if (!string.IsNullOrEmpty(sort))
            {
                switch (sort.ToLower())
                {
                    case "price-asc": query = query.OrderBy(p => p.Price); break;
                    case "price-desc": query = query.OrderByDescending(p => p.Price); break;
                    case "name-asc": query = query.OrderBy(p => p.Title); break;
                    case "name-desc": query = query.OrderByDescending(p => p.Title); break;
                    case "newest": query = query.OrderByDescending(p => p.ProductId); break;
                    default: query = query.OrderByDescending(p => p.ProductId); break;
                }
            }
            else
            {
                query = query.OrderByDescending(p => p.ProductId);
            }

            // 6. Phân trang
            int actualSize = limit.HasValue ? limit.Value : pageSize;
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
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductBadges)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null) return NotFound();
            return product;
        }

        // GET: api/Products/categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetCategories()
        {
            var categories = await _context.Categories
                .Select(c => new { c.CategoryId, c.CategoryName, c.CategoryCode })
                .ToListAsync();
            return Ok(categories);
        }

        // GET: api/Products/subcategories
        [HttpGet("subcategories")]
        public async Task<IActionResult> GetAllSubCategories()
        {
            var subs = await _context.SubCategories
                .SelectMany(s => s.CategorySubCategories.Select(csc => new
                {
                    s.SubCategoryId,
                    s.SubCategoryName,
                    csc.CategoryId
                }))
                .ToListAsync();
            return Ok(subs);
        }

        // GET: api/Products/sizes
        [HttpGet("sizes")]
        public async Task<IActionResult> GetUniqueSizes()
        {
            var sizes = await _context.ProductSizes
                .Select(s => s.SizeName)
                .Distinct()
                .ToListAsync();
            return Ok(sizes);
        }

        // =================================================================
        // 3. CÁC API QUẢN TRỊ (ADMIN - CREATE / UPDATE / DELETE)
        // =================================================================

        // POST: api/Products/create (UPLOAD ẢNH CLOUDINARY)
        [HttpPost("create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateProduct([FromForm] ProductCreateDto request)
        {
            if (request == null) return BadRequest("Dữ liệu không hợp lệ");

            // 1. Upload ảnh lên Cloudinary 
            string mainImageUrl = "https://via.placeholder.com/300"; // Ảnh mặc định nếu ko up

            if (request.ImageFile != null)
            {
                // Gọi Service Upload
                var uploadedUrl = await _cloudinaryService.UploadImageAsync(request.ImageFile);
                if (!string.IsNullOrEmpty(uploadedUrl))
                {
                    mainImageUrl = uploadedUrl;
                }
            }

            // 2. Tạo Entity Product
            var newProduct = new Product
            {
                Title = request.Title,
                Price = request.Price,
                Description = request.Description,
                Quantity = request.Quantity,
                CategoryId = request.CategoryId,
                SubCategoryId = (request.SubCategoryId == 0) ? null : request.SubCategoryId,
                ProductImages = new List<ProductImage>(),
                ProductSizes = new List<ProductSize>(),
                ProductBadges = new List<ProductBadge>()
            };

            // 3. Thêm ảnh vào list (Ảnh upload từ máy tính)
            newProduct.ProductImages.Add(new ProductImage
            {
                ImageUrl = mainImageUrl,
                IsMain = true
            });

            // 4. Xử lý Size
            if (request.Sizes != null && request.Sizes.Count > 0)
            {
                foreach (var size in request.Sizes)
                {
                    newProduct.ProductSizes.Add(new ProductSize { SizeName = size });
                }
            }

            // 5. Lưu vào Database
            try
            {
                _context.Products.Add(newProduct);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Thêm sản phẩm thành công!",
                    productId = newProduct.ProductId,
                    imageUrl = mainImageUrl
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi server: " + ex.Message);
            }
        }

        // PUT: api/Products/update/5
        [HttpPut("update/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromForm] ProductCreateDto request)
        {
            // 1. Tìm sản phẩm cũ trong DB
            var product = await _context.Products
                .Include(p => p.ProductImages)
                .Include(p => p.ProductSizes)
                .Include(p => p.ProductBadges)
                .FirstOrDefaultAsync(p => p.ProductId == id);

            if (product == null) return NotFound("Không tìm thấy sản phẩm");

            // 2. Cập nhật thông tin cơ bản
            product.Title = request.Title;
            product.Price = request.Price;
            product.Description = request.Description;
            product.CategoryId = request.CategoryId;
            product.Quantity = request.Quantity;

            // Xử lý SubCategoryId (nếu gửi lên 0 thì set null)
            product.SubCategoryId = (request.SubCategoryId == 0) ? null : request.SubCategoryId;

            // 3. Xử lý Ảnh 
            // Chỉ khi nào có file ảnh mới gửi lên thì mới upload và thay thế
            if (request.ImageFile != null)
            {
                // Upload ảnh mới lên Cloud
                var newImageUrl = await _cloudinaryService.UploadImageAsync(request.ImageFile);

                if (!string.IsNullOrEmpty(newImageUrl))
                {
                    // Xóa ảnh cũ đi 
                    _context.ProductImages.RemoveRange(product.ProductImages);

                    // Thêm ảnh mới vào
                    product.ProductImages.Add(new ProductImage
                    {
                        ImageUrl = newImageUrl,
                        IsMain = true
                    });
                }
            }

            // 4. Cập nhật Size (Xóa cũ thêm mới)
            if (request.Sizes != null) // Nếu có gửi list size
            {
                _context.ProductSizes.RemoveRange(product.ProductSizes); // Xóa hết size cũ
                foreach (var s in request.Sizes)
                {
                    product.ProductSizes.Add(new ProductSize { SizeName = s });
                }
            }

            // 5. Cập nhật Badge 
            if (request.Badges != null) 
            {
                _context.ProductBadges.RemoveRange(product.ProductBadges); 
                foreach (var s in request.Badges)
                {
                    product.ProductBadges.Add(new ProductBadge { BadgeName = s });
                }
            }
            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "Cập nhật sản phẩm thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi cập nhật: " + ex.Message);
            }
        }

        // DELETE: api/Products/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            // Tìm sản phẩm
            var product = await _context.Products.FindAsync(id);

            if (product == null) return NotFound();

            product.IsActive = false;

            product.Title = product.Title + " (Deleted)"; 

            await _context.SaveChangesAsync();

            return NoContent();
        }
        // =================================================================
        // API QUẢN LÝ THÙNG RÁC (SOFT DELETE RECOVERY)
        // =================================================================

        // GET: api/Products/deleted
        // Lấy danh sách các sản phẩm đã bị xóa mềm (IsActive = false)
        [HttpGet("deleted")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetDeletedProducts()
        {
            var deletedProducts = await _context.Products
                .Include(p => p.Category)
                .Include(p => p.SubCategory)
                .Include(p => p.ProductImages)
                .Where(p => p.IsActive == false)// Chỉ lấy những cái IsActive = false
                .OrderByDescending(p => p.ProductId)
                .ToListAsync();

            return Ok(deletedProducts);
        }

        // PUT: api/Products/restore/5
        // Khôi phục sản phẩm (Set IsActive = true)
        [HttpPut("restore/{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> RestoreProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);

            if (product == null)
            {
                return NotFound("Không tìm thấy sản phẩm này (có thể đã bị xóa vĩnh viễn).");
            }

            // HỒI SINH SẢN PHẨM
            product.IsActive = true;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = $"Đã khôi phục sản phẩm: {product.Title}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Lỗi khôi phục: " + ex.Message);
            }
        }
    }
}