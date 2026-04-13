using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Reviews")]
    public class ProductReviews
    {
        [Key]
        [Column("id")]
        public int id { get; set; }

        [Column("product_id")]
        public int product_id { get; set; }

        [Column("user_id")]
        public int user_id { get; set; }

        [Required]
        [Column("content")]
        public string content { get; set; }

        [Required]
        [Range(1, 5)]
        [Column("rating")]
        public int rating { get; set; }

        [Column("create_at")]
        public DateTime create_at { get; set; } = DateTime.UtcNow;

        // Navigation properties
        [ForeignKey(nameof(product_id))]
        [JsonIgnore]
        public virtual Products? Product { get; set; }

        [ForeignKey(nameof(user_id))]
        [JsonIgnore]
        public virtual Users? User { get; set; }
    }
}
