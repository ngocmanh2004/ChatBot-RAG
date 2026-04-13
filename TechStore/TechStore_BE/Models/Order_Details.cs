using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Order_Details")]
    public class Order_Details
    {
        [Key]
        [Column("id")]
        public int id { get; set; }

        [ForeignKey(nameof(Order))]
        [Column("order_id")]
        public int order_id { get; set; }

        [ForeignKey(nameof(Product))]
        [Column("product_id")]
        public int product_id { get; set; }

        // Navigation properties
        [JsonIgnore]
        public virtual Orders? Order { get; set; }

        [JsonIgnore]
        public virtual Products? Product { get; set; }

        [Column("price")]
        public decimal price { get; set; }

        [Column("number_of_products")]
        public int number_of_products { get; set; }

        [Column("total_money")]
        public decimal total_money { get; set; }

        // ✅ Thêm tên sản phẩm để lưu snapshot
        [Column("product_name")]
        [MaxLength(255)]
        public string? product_name { get; set; }

        // ✅ Thêm đường dẫn ảnh sản phẩm
        [Column("image_path")]
        [MaxLength(500)]
        public string? image_path { get; set; }
    }
}
