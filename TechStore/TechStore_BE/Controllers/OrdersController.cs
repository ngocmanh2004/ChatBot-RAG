using System.Text.Json;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrdersController : ControllerBase
    {
        private readonly ApplicationDBContext _context;
        private readonly EmailService _emailService;

        public OrdersController(ApplicationDBContext context, EmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // GET: api/Orders?page=1&pageSize=10
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 30)
        {
            if (page <= 0 || pageSize <= 0)
                return BadRequest(new { message = "Giá trị page và pageSize phải lớn hơn 0." });

            var orders = await _context.Orders
                .OrderByDescending(o => o.create_at)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            if (!orders.Any())
                return NotFound();

            var result = orders.Select(o => new
            {
                order_id = o.order_id,
                user_id = o.user_id,
                full_name = o.full_name,
                order_status = o.order_status,
                create_at = o.create_at,
                total_amount = o.total_amount,
                address = o.address,
                phone = o.phone,
                payment_method = o.payment_method
            });

            return Ok(result);
        }

        // GET: api/Orders/5
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            var result = new
            {
                order_id = order.order_id,
                user_id = order.user_id,
                full_name = order.full_name,
                order_status = order.order_status,
                create_at = order.create_at,
                total_amount = order.total_amount,
                address = order.address,
                phone = order.phone,
                payment_method = order.payment_method
            };

            return Ok(result);
        }

        // GET: api/Orders/customer/1
        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetOrdersByCustomerId(int customerId)
        {
            var orders = await _context.Orders
                .Where(o => o.user_id == customerId)
                .OrderByDescending(o => o.create_at)
                .ToListAsync();

            if (!orders.Any())
                return NotFound($"Không tìm thấy đơn hàng nào cho khách hàng ID = {customerId}.");

            var result = orders.Select(o => new
            {
                order_id = o.order_id,
                user_id = o.user_id,
                full_name = o.full_name,
                order_status = o.order_status,
                create_at = o.create_at,
                total_amount = o.total_amount,
                address = o.address,
                phone = o.phone,
                payment_method = o.payment_method
            });

            return Ok(result);
        }

        // POST: api/Orders
        [HttpPost]
        public async Task<ActionResult> PostOrder([FromBody] Orders order)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (!await _context.Users.AnyAsync(u => u.user_id == order.user_id))
                return BadRequest(new { message = "user_id không hợp lệ. User không tồn tại." });

            order.create_at ??= DateTime.UtcNow;
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Thêm đơn hàng thành công!",
                order_id = order.order_id
            });
        }



        // PATCH: api/Orders/{id}

        [HttpPatch("{id}")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] string newStatus)
        {
            Console.WriteLine($"Received PATCH request for Order ID: {id}, New Status: {newStatus}");
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
            {
                Console.WriteLine($"Order ID {id} not found.");
                return NotFound($"Không tìm thấy đơn hàng có ID = {id}.");
            }

            var oldStatus = order.order_status;
            order.order_status = newStatus;

            try
            {
                await _context.SaveChangesAsync();

                var user = await _context.Users.FindAsync(order.user_id);
                if (user == null || string.IsNullOrEmpty(user.email))
                {
                    Console.WriteLine($"User not found or email missing for user_id: {order.user_id}");
                    return BadRequest("Không tìm thấy email người dùng.");
                }

                var orderDetails = await _context.Order_Details
                    .Where(od => od.order_id == id)
                    .ToListAsync();

                string productListHtml = @"
                <table style='border-collapse: collapse; width: 100%; font-size: 14px;'>
                    <thead>
                        <tr>
                            <th style='border: 1px solid #ddd; padding: 8px;'>Tên sản phẩm</th>
                            <th style='border: 1px solid #ddd; padding: 8px;'>Số lượng</th>
                            <th style='border: 1px solid #ddd; padding: 8px;'>Đơn giá</th>
                        </tr>
                    </thead>
                    <tbody>";
                foreach (var detail in orderDetails)
                {
                    productListHtml += $@"
                    <tr>
                        <td style='border: 1px solid #ddd; padding: 8px;'>{detail.product_name}</td>
                        <td style='border: 1px solid #ddd; padding: 8px; text-align: center;'>{detail.number_of_products}</td>
                        <td style='border: 1px solid #ddd; padding: 8px;'>{detail.price.ToString("N0")} VNĐ</td>
                    </tr>";
                }
                productListHtml += @"
                    </tbody>
                </table>";

                if ((oldStatus == "Chờ xác nhận" || oldStatus == "Đang xử lý") && newStatus == "Đã xác nhận")
                {
                    string subject = "Đơn hàng của bạn đã được xác nhận";
                    string body = $@"
                    <div style='font-family: Arial, sans-serif; font-size: 14px;'>
                        <p>Chào {order.full_name},</p>
                        <p>Đơn hàng của bạn tại TechStore đã được xác nhận.</p>
                        <p><strong>Mã đơn hàng:</strong> {order.order_id}</p>
                        <p><strong>Danh sách sản phẩm:</strong></p>
                        {productListHtml}
                        <p><strong>Tổng số tiền:</strong> {order.total_amount.ToString("N0")} VNĐ</p>
                        <p><strong>Địa chỉ giao hàng:</strong> {order.address}</p>
                        <p><strong>Số điện thoại:</strong> {order.phone}</p>
                        <p><strong>Trạng thái đơn hàng:</strong> {order.order_status}</p>
                        <p>Chúng tôi sẽ sớm giao hàng đến bạn. Cảm ơn bạn đã mua sắm tại TechStore!</p>
                        <p>Mọi thắc mắc vui lòng liên hệ hotline: 0787574880</p>
                    </div>";
                    await _emailService.SendEmailAsync(user.email, subject, body);
                }
                else if (newStatus == "Đã hủy")
                {
                    string subject = "Đơn hàng của bạn đã bị hủy";
                    string body = $@"
                    <div style='font-family: Arial; font-size: 14px;'>
                        <p>Chào {order.full_name},</p>
                        <p>Chúng tôi rất tiếc phải thông báo rằng đơn hàng của bạn đã bị hủy.</p>
                        <p><strong>Mã đơn hàng:</strong> {order.order_id}</p>
                        <p><strong>Danh sách sản phẩm:</strong></p>
                        {productListHtml}
                        <p><strong>Tổng số tiền:</strong> {order.total_amount.ToString("N0")} VNĐ</p>
                        <p><strong>Địa chỉ giao hàng:</strong> {order.address}</p>
                        <p><strong>Số điện thoại:</strong> {order.phone}</p>
                        <p><strong>Trạng thái đơn hàng:</strong> {order.order_status}</p>
                        <p>Mọi thắc mắc vui lòng liên hệ hotline: 0787574880</p>
                    </div>";
                    await _emailService.SendEmailAsync(user.email, subject, body);
                }

                return Ok(new { message = "Cập nhật trạng thái đơn hàng thành công!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating order status: {ex.Message}");
                return StatusCode(500, $"Lỗi: {ex.Message}");
            }
        }


        // PUT: api/Orders/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutOrder(int id, [FromBody] Orders order)
        {
            if (id != order.order_id)
                return BadRequest(new { message = "order_id không khớp." });

            var existingOrder = await _context.Orders.FindAsync(id);
            if (existingOrder == null)
                return NotFound();

            existingOrder.user_id = order.user_id;
            existingOrder.full_name = order.full_name;
            existingOrder.order_status = order.order_status;
            existingOrder.create_at = order.create_at ?? DateTime.UtcNow;
            existingOrder.total_amount = order.total_amount;
            existingOrder.address = order.address;
            existingOrder.phone = order.phone;
            existingOrder.payment_method = order.payment_method;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await OrdersExists(id))
                    return NotFound();
                throw;
            }

            return Ok(new { message = "Cập nhật đơn hàng thành công!" });
        }

        // DELETE: api/Orders/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrder(int id)
        {
            var order = await _context.Orders.FindAsync(id);
            if (order == null)
                return NotFound();

            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Xóa đơn hàng thành công!" });
        }

        [HttpGet("search")]
        public async Task<ActionResult<IEnumerable<object>>> SearchOrders([FromQuery] string keyword)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { message = "Keyword không được để trống." });

            keyword = keyword.Trim();               // bỏ khoảng trắng đầu/cuối

            var orders = await _context.Orders
                .Where(o =>
                    o.order_id.ToString().Contains(keyword) ||                       // mã đơn
                    (!string.IsNullOrEmpty(o.full_name) &&
                        EF.Functions.Like(o.full_name, $"%{keyword}%")) ||            // tên KH
                    (!string.IsNullOrEmpty(o.order_status) &&
                        EF.Functions.Like(o.order_status, $"%{keyword}%")) ||         // trạng thái
                    (!string.IsNullOrEmpty(o.address) &&
                        EF.Functions.Like(o.address, $"%{keyword}%")) ||              // địa chỉ
                    (!string.IsNullOrEmpty(o.phone) &&
                        o.phone.Contains(keyword))                                    // điện thoại
                )
                .OrderByDescending(o => o.create_at)
                .AsNoTracking()                                                       // hiệu năng
                .ToListAsync();

            // LUÔN trả về 200 kèm danh sách (kể cả rỗng)
            var result = orders.Select(o => new
            {
                o.order_id,
                o.user_id,
                full_name = o.full_name,
                order_status = o.order_status,
                create_at = o.create_at,
                total_amount = o.total_amount,
                address = o.address,
                phone = o.phone,
                payment_method = o.payment_method
            });

            return Ok(result);        // [] nếu không có gì khớp
        }


        // Kiểm tra tồn tại đơn hàng
        private async Task<bool> OrdersExists(int id)
        {
            return await _context.Orders.AnyAsync(e => e.order_id == id);
        }
    }
}