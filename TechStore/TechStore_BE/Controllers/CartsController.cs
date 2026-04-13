using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CartsController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public CartsController(ApplicationDBContext context)
        {
            _context = context;
        }

        // GET: api/Carts
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCarts()
        {
            var carts = await _context.Carts
                .Include(c => c.Product)
                .Include(c => c.User)
                .Select(c => new {
                    c.cart_id,
                    c.user_id,
                    c.product_id,
                    c.quantity,
                    c.added_at,
                    product_name = c.Product.product_name,
                    price = c.Product.price,
                    image_url = c.Product.image_url,
                    username = c.User.username
                })
                .ToListAsync();

            return Ok(carts);
        }

        // GET: api/Carts/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCart(int id)
        {
            var cart = await _context.Carts
                .Include(c => c.Product)
                .Include(c => c.User)
                .Where(c => c.cart_id == id)
                .Select(c => new {
                    c.cart_id,
                    c.user_id,
                    c.product_id,
                    c.quantity,
                    c.added_at,
                    product_name = c.Product.product_name,
                    price = c.Product.price,
                    image_url = c.Product.image_url,
                    username = c.User.username
                })
                .FirstOrDefaultAsync();

            if (cart == null)
                return NotFound(new { Message = "Không tìm thấy giỏ hàng." });

            return Ok(cart);
        }
        // GET: api/Carts/user/2
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetCartsByUserId(int userId)
        {
            var carts = await _context.Carts
                .Include(c => c.Product)
                .Include(c => c.User)
                .Where(c => c.user_id == userId)
                .Select(c => new {
                    c.cart_id,
                    c.user_id,
                    c.product_id,
                    c.quantity,
                    c.added_at,
                    product_name = c.Product.product_name,
                    price = c.Product.price,
                    image_url = c.Product.image_url,
                    username = c.User.username
                })
                .ToListAsync();

            return Ok(carts);
        }


        // POST: api/Carts
        [HttpPost]
        public async Task<ActionResult> PostCart([FromBody] Carts cart)
        {
            if (cart == null || cart.user_id <= 0 || cart.product_id <= 0 || cart.quantity <= 0)
                return BadRequest(new { Message = "Dữ liệu giỏ hàng không hợp lệ." });

            // Kiểm tra xem sản phẩm đã có trong giỏ hàng của người dùng chưa
            var existingCartItem = await _context.Carts
                .FirstOrDefaultAsync(c => c.user_id == cart.user_id && c.product_id == cart.product_id);

            if (existingCartItem != null)
            {
                // Nếu đã có, tăng số lượng
                existingCartItem.quantity += cart.quantity;
                existingCartItem.added_at = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Cập nhật số lượng sản phẩm trong giỏ hàng thành công!", cart_id = existingCartItem.cart_id });
            }
            else
            {
                // Nếu chưa có, thêm mới
                cart.added_at = DateTime.UtcNow;
                _context.Carts.Add(cart);
                await _context.SaveChangesAsync();

                return Ok(new { Message = "Thêm vào giỏ hàng thành công!", cart_id = cart.cart_id });
            }
        }


        // PUT: api/Carts/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCart(int id, [FromBody] Carts cart)
        {
            if (id != cart.cart_id)
                return BadRequest(new { Message = "ID không khớp." });

            var existing = await _context.Carts.FindAsync(id);
            if (existing == null)
                return NotFound(new { Message = "Không tìm thấy giỏ hàng." });

            // Chỉ cập nhật các trường được phép
            existing.quantity = cart.quantity;
            existing.product_id = cart.product_id;
            existing.user_id = cart.user_id;

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật giỏ hàng thành công!" });
        }

        // DELETE: api/Carts/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCart(int id)
        {
            var cart = await _context.Carts.FindAsync(id);
            if (cart == null)
                return NotFound(new { Message = "Không tìm thấy giỏ hàng." });

            _context.Carts.Remove(cart);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Xóa giỏ hàng thành công!" });
        }
    }
}
