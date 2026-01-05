using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using Microsoft.AspNetCore.Authorization;
using BackEnd.DTOs;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class SubCategoriesController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public SubCategoriesController(FashionShopDbContext context) { _context = context; }

        // POST: api/SubCategories (Thêm danh mục con)
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateSubCategory([FromBody] CreateSubDto model)
        {
            // 1. Tạo SubCategory
            var sub = new SubCategory
            {
                SubCategoryName = model.SubCategoryName,
                SubCategoryCode = model.SubCategoryCode
            };
            _context.SubCategories.Add(sub);
            await _context.SaveChangesAsync();

            // 2. Liên kết với Category cha (Bảng trung gian)
            var link = new CategorySubCategory
            {
                CategoryId = model.CategoryId,
                SubCategoryId = sub.SubCategoryId
            };
            _context.CategorySubCategories.Add(link);
            await _context.SaveChangesAsync();

            return Ok(sub);
        }

        // PUT: api/SubCategories/5 (Sửa)
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateSubCategory(int id, [FromBody] SubCategory sub)
        {
            if (id != sub.SubCategoryId) return BadRequest();

            var existing = await _context.SubCategories.FindAsync(id);
            if (existing == null) return NotFound();

            existing.SubCategoryName = sub.SubCategoryName;
            existing.SubCategoryCode = sub.SubCategoryCode;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật thành công" });
        }

        // DELETE: api/SubCategories/5 (Xóa)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteSubCategory(int id)
        {
            // Check sản phẩm trước
            bool hasProduct = await _context.Products.AnyAsync(p => p.SubCategoryId == id);
            if (hasProduct) return BadRequest("Không thể xóa: Loại sản phẩm này đang được sử dụng!");

            var sub = await _context.SubCategories.FindAsync(id);
            if (sub == null) return NotFound();

            // Xóa liên kết bảng trung gian trước (Cascade thường tự làm, nhưng viết code cho chắc)
            var links = _context.CategorySubCategories.Where(x => x.SubCategoryId == id);
            _context.CategorySubCategories.RemoveRange(links);

            _context.SubCategories.Remove(sub);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thành công" });
        }
    }

   
}