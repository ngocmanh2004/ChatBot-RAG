using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

using TechStore_BE.Models;

public class Brands
{
    [Key]
    public int brand_id { get; set; }

    public string brand_name { get; set; }

    public int category_id { get; set; }

    [JsonIgnore]
    [ForeignKey("category_id")]
    public virtual Categories? category { get; set; }
}
