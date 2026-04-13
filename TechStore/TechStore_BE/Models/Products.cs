using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Products")]
    public class Products
    {
        [Key]
        [Column("product_id")]
        public int product_id { get; set; }

        [Column("product_name")]
        public string? product_name { get; set; }

        [Column("brand_id")]
        public int brand_id { get; set; }

        [Column("category_id")]
        public int category_id { get; set; }

        [Column("price")]
        public decimal price { get; set; }

        [Column("quantity")]
        public int quantity { get; set; }

        [Column("description")]
        public string? description { get; set; }

        [Column("image_url")]
        public string? image_url { get; set; }

        [Column("cpu_chip")]
        public string? cpu_chip { get; set; }

        [Column("gpu")]
        public string? gpu { get; set; }

        [Column("ram_gb")]
        public int? ram_gb { get; set; }

        [Column("storage_gb")]
        public int? storage_gb { get; set; }

        [Column("battery_mah")]
        public int? battery_mah { get; set; }

        [Column("fast_charge_w")]
        public int? fast_charge_w { get; set; }

        [Column("rear_camera_mp")]
        public decimal? rear_camera_mp { get; set; }

        [Column("front_camera_mp")]
        public decimal? front_camera_mp { get; set; }

        [Column("screen_size_inch")]
        public decimal? screen_size_inch { get; set; }

        [Column("screen_resolution")]
        public string? screen_resolution { get; set; }

        [Column("refresh_rate_hz")]
        public int? refresh_rate_hz { get; set; }

        // Navigation property
        [JsonIgnore]
        [ForeignKey("brand_id")]
        public virtual Brands? Brand { get; set; }

        [JsonIgnore]
        [ForeignKey("category_id")]
        [InverseProperty("Products")]
        public virtual Categories? Category { get; set; }

        [JsonIgnore]
        public virtual ICollection<ProductReviews>? ProductReviews { get; set; }

        [JsonIgnore]
        public virtual ICollection<Order_Details>? OrderDetails { get; set; }
    }
}
