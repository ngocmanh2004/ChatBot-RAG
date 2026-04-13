using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrandsController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public BrandsController(ApplicationDBContext context)
        {
            _context = context;
        }

        // GET: api/Brands
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetBrands()
        {
            var brands = await _context.Brands
                .Select(b => new {
                    b.brand_id,
                    b.brand_name,
                    b.category_id
                })
                .ToListAsync();

            if (brands == null || brands.Count == 0)
            {
                return NotFound();
            }

            return Ok(brands);
        }

        // GET: api/Brands/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetBrands(int id)
        {
            var brand = await _context.Brands
                .Where(b => b.brand_id == id)
                .Select(b => new {
                    b.brand_id,
                    b.brand_name,
                    b.category_id
                })
                .FirstOrDefaultAsync();

            if (brand == null)
            {
                return NotFound();
            }

            return Ok(brand);
        }

        // GET: api/Brands/ByCategory/5
        [HttpGet("ByCategory/{id_danhmuc}")]
        public async Task<ActionResult<IEnumerable<object>>> GetBrandsByCategory(int id_danhmuc)
        {
            var brands = await _context.Brands
                .Where(b => b.category_id == id_danhmuc)
                .Select(b => new {
                    b.brand_id,
                    b.brand_name,
                    b.category_id
                })
                .ToListAsync();

            if (!brands.Any())
            {
                return NotFound();
            }

            return Ok(brands);
        }

        // PUT: api/Brands/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBrands(int id, Brands brands)
        {
            if (id != brands.brand_id)
            {
                return BadRequest();
            }

            var brandToUpdate = await _context.Brands.FindAsync(id);
            if (brandToUpdate == null)
            {
                return NotFound();
            }

            brandToUpdate.brand_name = brands.brand_name;
            brandToUpdate.category_id = brands.category_id;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BrandsExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return Ok(new { message = "Cập nhật thương hiệu thành công!" });
        }

        // POST: api/Brands
        [HttpPost]
        public async Task<ActionResult> PostBrands(Brands brand)
        {
            var categoryExists = await _context.Categories
                .AnyAsync(c => c.category_id == brand.category_id);

            if (!categoryExists)
            {
                return BadRequest(new { message = "category_id không hợp lệ. Category không tồn tại." });
            }

            _context.Brands.Add(brand);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm thương hiệu thành công!",
                brand_id = brand.brand_id
            });
        }


        // DELETE: api/Brands/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrands(int id)
        {
            var brand = await _context.Brands.FindAsync(id);
            if (brand == null)
            {
                return NotFound();
            }

            _context.Brands.Remove(brand);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa thương hiệu thành công!" });
        }

        private bool BrandsExists(int id)
        {
            return _context.Brands.Any(e => e.brand_id == id);
        }
    }
}
