using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

namespace TechStore_BE.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly ApplicationDBContext _context;

        public UsersController(ApplicationDBContext context)
        {
            _context = context;
        }

        // GET: api/Users/5
        /// <summary>
        /// Lấy thông tin người dùng theo ID.
        /// </summary>
        /// <param name="id">Mã người dùng.</param>
        /// <returns>Thông tin cơ bản của người dùng.</returns>
        [HttpGet("{id}")]
        [ProducesResponseType(StatusCodes.Status200OK)]
        [ProducesResponseType(StatusCodes.Status404NotFound)]
        public async Task<ActionResult<object>> GetUserId(int id)
        {
            var user = await _context.Users
                .Where(u => u.user_id == id)
                .Select(u => new
                {
                    u.user_id,
                    u.username,
                    u.email,
                    u.phone,
                    u.password,
                    u.address,
                    u.create_at,
                    u.role_id
                })
                .FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            return Ok(user);
        }

        // GET: api/Users/role/2
        // GET: api/Users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetAllUsers()
        {
            var users = await _context.Users
                .Select(u => new
                {
                    u.user_id,
                    u.username,
                    u.email,
                    u.phone,
                    u.password,
                    u.address,
                    u.create_at,
                    u.role_id
                })
                .ToListAsync();

            return Ok(users);
        }


        // PUT: api/Users/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutUsers(int id, Users users)
        {
            if (id != users.user_id)
            {
                return BadRequest();
            }

            var userToUpdate = await _context.Users.FindAsync(id);
            if (userToUpdate == null)
            {
                return NotFound();
            }

            userToUpdate.username = users.username;
            userToUpdate.email = users.email;
            userToUpdate.phone = users.phone;
            userToUpdate.password = users.password;
            userToUpdate.address = users.address;
            userToUpdate.role_id = users.role_id;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UsersExists(id))
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

        // POST: api/Users
        [HttpPost]
        public async Task<ActionResult<Users>> PostUsers(Users users)
        {
            if (string.IsNullOrWhiteSpace(users.username))
            {
                return BadRequest("Username is required");
            }

            if (string.IsNullOrWhiteSpace(users.password))
            {
                return BadRequest("Password is required");
            }

            if (users.role_id == 0)
            {
                users.role_id = 2;
            }

            if (await _context.Users.AnyAsync(u => u.username == users.username))
            {
                return BadRequest(new { message = "Username already exists" });
            }

            // Hash the password before saving
            users.password = BCrypt.Net.BCrypt.HashPassword(users.password);

            _context.Users.Add(users);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetUserId", new { id = users.user_id }, users);
        }
        public class LoginRequest
        {
            public string Username { get; set; }
            public string Password { get; set; }
        }

        /// <summary>
        /// Đăng nhập vào hệ thống.
        /// </summary>
        /// <param name="loginRequest">Thông tin tài khoản và mật khẩu.</param>
        /// <returns>Thông tin người dùng và vai trò nếu đăng nhập thành công.</returns>
        /// <response code="200">Đăng nhập thành công.</response>
        /// <response code="401">Sai tài khoản hoặc mật khẩu.</response>
        /// <response code="400">Thiếu thông tin đăng nhập.</response>
        [HttpPost("login")]
        [ProducesResponseType(typeof(ResponseModel.LoginResponse), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ResponseModel.LoginResponse), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(StatusCodes.Status400BadRequest)]
        public async Task<ActionResult> DangNhap([FromBody] LoginRequest loginRequest)
        {
            // Validate the input
            if (loginRequest == null || string.IsNullOrEmpty(loginRequest.Username) || string.IsNullOrEmpty(loginRequest.Password))
            {
                //return BadRequest(new { message = "Username or password is missing" });
                var response = new { message = "Username or password is missing" };
                return BadRequest(response);
            }

            // Check if the user exists in the database
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.username == loginRequest.Username);

            if (user == null)
            {
                var response = new ResponseModel.LoginResponse
                {
                    Success = false,
                    Message = "Invalid username or password",
                    Role = string.Empty,
                    User = null
                };
                return Unauthorized(response); // Return 401 Unauthorized
            }

            // Verify password using BCrypt (or fallback to plain text for old accounts)
            bool isPasswordValid = false;
            try
            {
                isPasswordValid = BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.password);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                // Fallback for plain-text passwords stored before encryption was implemented
                if (user.password == loginRequest.Password)
                {
                    isPasswordValid = true;
                    // Automatically upgrade the plain-text password to hashed for future logins
                    user.password = BCrypt.Net.BCrypt.HashPassword(loginRequest.Password);
                    _context.Entry(user).State = EntityState.Modified;
                    await _context.SaveChangesAsync();
                }
            }

            if (!isPasswordValid)
            {
                var response = new ResponseModel.LoginResponse
                {
                    Success = false,
                    Message = "Invalid username or password",
                    Role = string.Empty,
                    User = null
                };
                return Unauthorized(response);
            }


            // Determine user role
            var role = user.role_id == 1 ? "Admin" : "User";

            // Prepare success response
            var successResponse = new ResponseModel.LoginResponse
            {
                Success = true,
                Message = $"Login successful - {role}",
                Role = role,
                User = new ResponseModel.UserResponse
                {
                    user_id = user.user_id,
                    username = user.username,
                    role_id = user.role_id
                }
            };

            return Ok(successResponse); // Return 200 OK with response
        }

        public class LogoutResult
        {
            public bool Success { get; set; }
            public string Message { get; set; }
        }

        // Đăng xuất
        [HttpPost("logout")]
        public IActionResult DangXuat()
        {

            return Ok(new LogoutResult { Success = true, Message = "Successfully logged out" });
        }

        // PATCH: api/Users/{id}/password
        [HttpPatch("{id}/password")]
        public async Task<IActionResult> UpdatePassword(int id, [FromBody] UpdatePasswordRequest request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.CurrentPassword) || string.IsNullOrWhiteSpace(request.NewPassword))
            {
                return BadRequest("Invalid request data.");
            }

            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound();
            }

            bool isCurrentPasswordValid = false;
            try
            {
                isCurrentPasswordValid = BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.password);
            }
            catch (BCrypt.Net.SaltParseException)
            {
                isCurrentPasswordValid = user.password == request.CurrentPassword;
            }

            if (!isCurrentPasswordValid)
            {
                return Unauthorized(new { message = "Current password is incorrect." });
            }

            // Cập nhật mật khẩu mới và mã hóa
            user.password = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

            _context.Entry(user).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!UsersExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent(); // Trả về NoContent nếu thành công
        }


        // Model để nhận dữ liệu từ yêu cầu
        public class UpdatePasswordRequest
        {
            public string CurrentPassword { get; set; }
            public string NewPassword { get; set; }
        }


        // DELETE: api/Users/5
        [HttpDelete("deleteUser/{userId}")]
        public async Task<IActionResult> DeleteUser(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
            {
                return NotFound();
            }

            _context.Users.Remove(user);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool UsersExists(int id)
        {
            return _context.Users.Any(e => e.user_id == id);
        }
    }
}
