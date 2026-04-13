namespace TechStore_BE.Models
{
    public class ResponseModel
    {
        public class LoginResponse
        {
            public bool Success { get; set; }
            public string Message { get; set; }
            public string Role { get; set; }
            public UserResponse User { get; set; }
        }

        public class UserResponse
        {
            public int user_id { get; set; }
            public string username { get; set; }
            public int role_id { get; set; }
        }

    }
}
