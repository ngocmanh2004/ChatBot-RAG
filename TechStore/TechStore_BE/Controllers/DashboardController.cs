using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TechStore_BE.DataConnection;
using Microsoft.EntityFrameworkCore;


namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public DashboardController(ApplicationDBContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers = await _context.Users.CountAsync();
            var totalOrders = await _context.Orders.CountAsync();
            var totalProducts = await _context.Products.CountAsync();
            var totalRevenue = await _context.Orders.SumAsync(o => o.total_amount);

            return Ok(new
            {
                totalUsers,
                totalOrders,
                totalProducts,
                totalRevenue
            });
        }

        [HttpGet("monthly-revenue")]
        public async Task<IActionResult> GetMonthlyRevenue()
        {
            var monthlyData = await _context.Orders
                .Where(o => o.create_at.HasValue)
                .GroupBy(o => new
                {
                    Year = o.create_at.Value.Year,
                    Month = o.create_at.Value.Month
                })
                .Select(g => new
                {
                    Year = g.Key.Year,
                    Month = g.Key.Month,
                    TotalRevenue = g.Sum(o => o.total_amount)
                })
                .OrderBy(x => x.Year)
                .ThenBy(x => x.Month)
                .ToListAsync();

            // Xử lý định dạng chuỗi ngoài LINQ
            var result = monthlyData.Select(x => new
            {
                Month = $"{x.Month:D2}/{x.Year}",
                TotalRevenue = x.TotalRevenue
            });

            return Ok(result);
        }


    }

}
