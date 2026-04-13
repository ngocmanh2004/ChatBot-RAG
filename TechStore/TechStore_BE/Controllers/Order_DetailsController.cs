using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class Order_DetailsController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public Order_DetailsController(ApplicationDBContext context)
        {
            _context = context;
        }

        // Lấy tất cả chi tiết đơn hàng
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Order_Details>>> GetAllOrderDetails()
        {
            var orderDetails = await _context.Order_Details.ToListAsync();
            if (orderDetails == null || !orderDetails.Any())
                return NotFound("Không tìm thấy chi tiết đơn hàng nào.");

            return Ok(orderDetails);
        }

        // Lấy chi tiết đơn hàng theo ID
        [HttpGet("{id}")]
        public async Task<ActionResult<Order_Details>> GetOrderDetailById(int id)
        {
            var detail = await _context.Order_Details.FindAsync(id);
            if (detail == null)
                return NotFound($"Không tìm thấy chi tiết đơn hàng có ID = {id}.");

            return Ok(detail);
        }

        // Lấy danh sách chi tiết theo order_id
        [HttpGet("order_id/{orderId}")]
        public async Task<ActionResult<IEnumerable<Order_Details>>> GetDetailsByOrderId(int orderId)
        {
            var details = await _context.Order_Details
                .Where(od => od.order_id == orderId)
                .ToListAsync();

            if (!details.Any())
                return NotFound($"Không tìm thấy chi tiết đơn hàng nào với mã đơn hàng = {orderId}.");

            return Ok(details);
        }

        // Thêm mới chi tiết đơn hàng
        [HttpPost]
        public async Task<ActionResult<Order_Details>> CreateOrderDetail(Order_Details orderDetail)
        {
            _context.Order_Details.Add(orderDetail);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetOrderDetailById), new { id = orderDetail.id }, orderDetail);
        }

        // Cập nhật chi tiết đơn hàng
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateOrderDetail(int id, Order_Details updatedDetail)
        {
            if (id != updatedDetail.id)
                return BadRequest("ID không khớp.");

            _context.Entry(updatedDetail).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!OrderDetailExists(id))
                    return NotFound($"Không tìm thấy chi tiết đơn hàng có ID = {id}.");

                throw;
            }

            return Ok("Cập nhật chi tiết đơn hàng thành công.");
        }

        // Xoá chi tiết đơn hàng theo ID
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteOrderDetail(int id)
        {
            var detail = await _context.Order_Details.FindAsync(id);
            if (detail == null)
                return NotFound($"Không tìm thấy chi tiết đơn hàng có ID = {id}.");

            _context.Order_Details.Remove(detail);
            await _context.SaveChangesAsync();

            return Ok("Xoá chi tiết đơn hàng thành công.");
        }

        // Xoá tất cả chi tiết đơn hàng theo order_id
        // Xóa chi tiết đơn hàng theo order_id, nếu đơn hàng đang ở trạng thái "Đang xử lý"
        [HttpDelete("order_id/{orderId}")]
        public async Task<IActionResult> DeleteDetailsByOrderId(int orderId)
        {
            // Kiểm tra đơn hàng có tồn tại không
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.order_id == orderId);
            if (order == null)
                return NotFound($"Không tìm thấy đơn hàng có ID = {orderId}.");

            // Kiểm tra trạng thái đơn hàng
            if (order.order_status != "Đang xử lý")
                return BadRequest("Chỉ có thể xóa đơn hàng ở trạng thái 'Đang xử lý'.");

            // Lấy chi tiết đơn hàng
            var details = await _context.Order_Details
                .Where(od => od.order_id == orderId)
                .ToListAsync();

            if (!details.Any())
                return NotFound("Không tìm thấy chi tiết đơn hàng nào để xóa.");

            // Xóa
            _context.Order_Details.RemoveRange(details);
            await _context.SaveChangesAsync();

            return Ok("Đã xóa chi tiết đơn hàng thành công.");
        }





        // Kiểm tra tồn tại
        private bool OrderDetailExists(int id)
        {
            return _context.Order_Details.Any(e => e.id == id);
        }
    }
}
