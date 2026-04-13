using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;


namespace TechStore_BE.Models
{
    [Table("Categories")]
    public class Categories
    {
        [Key]
        [Column("category_id")]
        public int category_id { get; set; }

        [Column("category_name")]
        public string? category_name { get; set; }

        // Navigation properties
        [JsonIgnore]
        [InverseProperty("Category")]
        public virtual ICollection<Products> Products { get; set; } = new List<Products>();

        [JsonIgnore]
        public virtual ICollection<Brands> Brands { get; set; } = new List<Brands>();
    }
}

