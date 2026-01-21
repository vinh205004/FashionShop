using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using Microsoft.AspNetCore.Authorization;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoriesController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public CategoriesController(FashionShopDbContext context)
        {
            _context = context;
        }

        // GET: api/Categories
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Category>>> GetCategories()
        {
            return await _context.Categories
                .Include(c => c.CategorySubCategories)
                    .ThenInclude(cs => cs.SubCategory)
                .ToListAsync();
        }

        // GET: api/Categories/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Category>> GetCategory(int id)
        {
            var category = await _context.Categories.FindAsync(id);

            if (category == null)
            {
                return NotFound();
            }

            return category;
        }

        // PUT: api/Categories/5
        // Chỉ Admin được sửa
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutCategory(int id, Category category)
        {
            if (id != category.CategoryId)
            {
                return BadRequest();
            }

            _context.Entry(category).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CategoryExists(id))
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
        // GET: api/Categories/1/subcategories
        // Lấy danh sách danh mục con dựa trên ID danh mục cha
        [HttpGet("{categoryId}/subcategories")]
        public async Task<IActionResult> GetSubCategoriesByCategoryId(int categoryId)
        {
            var subs = await _context.CategorySubCategories
                .Where(csc => csc.CategoryId == categoryId)
                .Select(csc => new
                {
                    csc.SubCategory.SubCategoryId,
                    csc.SubCategory.SubCategoryName,
                    csc.SubCategory.SubCategoryCode
                })
                .ToListAsync();

            return Ok(subs);
        }
        // POST: api/Categories
        // Chỉ Admin được thêm mới
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Category>> PostCategory(Category category)
        {
            _context.Categories.Add(category);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetCategory", new { id = category.CategoryId }, category);
        }

        // DELETE: api/Categories/5
        // 🔥 BẢO MẬT: Chỉ Admin được xóa
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            // 1. Kiểm tra xem có sản phẩm nào đang dùng Category này không
            bool hasProduct = await _context.Products.AnyAsync(p => p.CategoryId == id);
            if (hasProduct)
            {
                return BadRequest("Không thể xóa: Danh mục này đang chứa sản phẩm!");
            }

            // 2. Kiểm tra xem có SubCategory con không
            
            bool hasSub = await _context.CategorySubCategories.AnyAsync(csc => csc.CategoryId == id);
            if (hasSub)
            {
                return BadRequest("Không thể xóa: Danh mục này đang có danh mục con. Hãy xóa con trước!");
            }

            var category = await _context.Categories.FindAsync(id);
            if (category == null) return NotFound();

            _context.Categories.Remove(category);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa danh mục thành công" });
        }

        private bool CategoryExists(int id)
        {
            return _context.Categories.Any(e => e.CategoryId == id);
        }
    }
}