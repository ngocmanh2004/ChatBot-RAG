    using System.Collections.Generic;
    using System.Linq;
    using System.Threading.Tasks;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.EntityFrameworkCore;
    using TechStore_BE.DataConnection;
    using TechStore_BE.Models;

    namespace TechStore_BE.Controllers
    {
        [Route("api/[controller]")]
        [ApiController]
        public class CategoriesController : ControllerBase
        {
            private readonly ApplicationDBContext _context;

            public CategoriesController(ApplicationDBContext context)
            {
                _context = context;
            }

            // GET: api/Categories
            [HttpGet]
            public async Task<ActionResult<IEnumerable<object>>> GetCategories()
            {
                var categories = await _context.Categories
                    .Select(c => new
                    {
                        c.category_id,
                        c.category_name
                    })
                    .ToListAsync();

                if (categories == null || categories.Count == 0)
                {
                    return NotFound();
                }

                return Ok(categories);
            }

            // GET: api/Categories/5
            [HttpGet("{id}")]
            public async Task<ActionResult<object>> GetCategory(int id)
            {
                var category = await _context.Categories
                    .Where(c => c.category_id == id)
                    .Select(c => new
                    {
                        c.category_id,
                        c.category_name
                    })
                    .FirstOrDefaultAsync();

                if (category == null)
                {
                    return NotFound();
                }

                return Ok(category);
            }

            // POST: api/Categories
            [HttpPost]
            public async Task<ActionResult> PostCategory(Categories category)
            {
                if (string.IsNullOrWhiteSpace(category.category_name))
                {
                    return BadRequest(new { message = "category_name không được để trống." });
                }

                _context.Categories.Add(category);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    message = "Thêm danh mục thành công!",
                    category_id = category.category_id
                });
            }

            // PUT: api/Categories/5
            [HttpPut("{id}")]
            public async Task<IActionResult> PutCategory(int id, Categories category)
            {
                if (id != category.category_id)
                {
                    return BadRequest();
                }

                var categoryToUpdate = await _context.Categories.FindAsync(id);
                if (categoryToUpdate == null)
                {
                    return NotFound();
                }

                categoryToUpdate.category_name = category.category_name;

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

                return Ok(new { message = "Cập nhật danh mục thành công!" });
            }

            // DELETE: api/Categories/5
            [HttpDelete("{id}")]
            public async Task<IActionResult> DeleteCategory(int id)
            {
                var category = await _context.Categories.FindAsync(id);
                if (category == null)
                {
                    return NotFound();
                }

                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Xóa danh mục thành công!" });
            }

            private bool CategoryExists(int id)
            {
                return _context.Categories.Any(e => e.category_id == id);
            }
        }
    }
