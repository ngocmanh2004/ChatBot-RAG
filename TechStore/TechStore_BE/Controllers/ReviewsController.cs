using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReviewsController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public ReviewsController(ApplicationDBContext context)
        {
            _context = context;
        }

        // GET: api/Reviews
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetReviews()
        {
            var reviews = await _context.ProductReviews
                .Include(r => r.Product)
                .Include(r => r.User)
                .Select(r => new {
                    r.id,
                    r.product_id,
                    r.user_id,
                    r.content,
                    r.rating,
                    r.create_at,
                    product_name = r.Product.product_name,
                    username = r.User.username
                })
                .ToListAsync();

            return Ok(reviews);
        }

        // GET: api/Reviews/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetReview(int id)
        {
            var review = await _context.ProductReviews
                .Include(r => r.Product)
                .Include(r => r.User)
                .Where(r => r.id == id)
                .Select(r => new {
                    r.id,
                    r.product_id,
                    r.user_id,
                    r.content,
                    r.rating,
                    r.create_at,
                    product_name = r.Product.product_name,
                    username = r.User.username
                })
                .FirstOrDefaultAsync();

            if (review == null)
                return NotFound(new { Message = "Không tìm thấy đánh giá." });

            return Ok(review);
        }

        // GET: api/Reviews/product/3
        [HttpGet("product/{productId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetReviewsByProduct(int productId)
        {
            var reviews = await _context.ProductReviews
                .Include(r => r.Product)
                .Include(r => r.User)
                .Where(r => r.product_id == productId)
                .Select(r => new {
                    r.id,
                    r.product_id,
                    r.user_id,
                    r.content,
                    r.rating,
                    r.create_at,
                    product_name = r.Product.product_name,
                    username = r.User.username
                })
                .ToListAsync();

            if (reviews == null || reviews.Count == 0)
                return NotFound(new { Message = "Không tìm thấy đánh giá cho sản phẩm này." });

            return Ok(reviews);
        }

        // POST: api/Reviews
        [HttpPost]
        public async Task<ActionResult> PostReview([FromBody] ProductReviews review)
        {
            if (review == null || string.IsNullOrEmpty(review.content) || review.rating < 1 || review.rating > 5)
                return BadRequest(new { Message = "Dữ liệu đánh giá không hợp lệ." });

            var productExists = await _context.Products.AnyAsync(p => p.product_id == review.product_id);
            var userExists = await _context.Users.AnyAsync(u => u.user_id == review.user_id);

            if (!productExists)
                return NotFound(new { Message = "Sản phẩm không tồn tại." });

            if (!userExists)
                return NotFound(new { Message = "Người dùng không tồn tại." });

            review.create_at = DateTime.UtcNow;

            _context.ProductReviews.Add(review);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Thêm đánh giá thành công!", review_id = review.id });
        }

        // PUT: api/Reviews/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReview(int id, [FromBody] ProductReviews review)
        {
            if (id != review.id)
                return BadRequest(new { Message = "ID không khớp." });

            var existing = await _context.ProductReviews.FindAsync(id);
            if (existing == null)
                return NotFound(new { Message = "Không tìm thấy đánh giá." });

            existing.content = review.content;
            existing.rating = review.rating;

            await _context.SaveChangesAsync();

            return Ok(new { Message = "Cập nhật đánh giá thành công!" });
        }

        // DELETE: api/Reviews/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var review = await _context.ProductReviews.FindAsync(id);
            if (review == null)
                return NotFound(new { Message = "Không tìm thấy đánh giá." });

            _context.ProductReviews.Remove(review);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa đánh giá thành công!" });
        }
    }   
}
