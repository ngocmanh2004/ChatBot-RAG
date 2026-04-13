using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Cart")]
    public class Carts
    {
        [Key]
        [Column("cart_id")]
        public int cart_id { get; set; }

        [ForeignKey(nameof(Product))]
        [Column("product_id")]
        public int product_id { get; set; }

        [ForeignKey(nameof(User))]
        [Column("user_id")]
        public int user_id { get; set; }

        [Column("quantity")]
        public int quantity { get; set; }

        [Column("added_at")]
        public DateTime added_at { get; set; }

        // Navigation properties
        [JsonIgnore]
        public virtual Products? Product { get; set; }

        [JsonIgnore]
        public virtual Users? User { get; set; }
    }
}
