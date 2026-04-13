using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace TechStore_BE.Models
{
    [Table("User")]
    public class UserLoginRequest
    {
        [Key]
        public int user_id { get; set; }
        public string? username { get; set; }
        public string? email { get; set; }
        public string? phone { get; set; }
        public string? password { get; set; }
        public string? address { get; set; }
        public DateTime create_at { get; set; }
        public int role_id { get; set; }
    }
}
