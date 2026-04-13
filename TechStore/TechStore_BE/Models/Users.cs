using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Users")]
    public class Users
    {
        [Key]
        [Column("user_id")]
        public int user_id { get; set; }

        [Column("username")]
        public string? username { get; set; }

        [Column("email")]
        public string? email { get; set; }

        [Column("phone")]
        public string? phone { get; set; }

        [Column("password")]
        public string? password { get; set; }

        [Column("address")]
        public string? address { get; set; }

        [Column("create_at")]
        public DateTime create_at { get; set; } = DateTime.UtcNow;

        [Column("role_id")]
        public int role_id { get; set; }

        [JsonIgnore]
        public virtual ICollection<Orders>? Orders { get; set; }  

        [JsonIgnore]
        public virtual ICollection<ProductReviews>? ProductReviews { get; set; }  
    }
}
