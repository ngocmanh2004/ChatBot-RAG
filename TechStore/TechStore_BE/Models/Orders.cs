using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TechStore_BE.Models
{
    [Table("Orders")]
    public class Orders
    {
        [Key]
        [Column("order_id")]
        public int order_id { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        [Column("user_id")]
        public int user_id { get; set; }

        [Required]
        [Column("full_name")]
        public string full_name { get; set; }

        [JsonIgnore]
        public virtual Users? User { get; set; }

        [Required]
        [Column("order_status")]
        public string order_status { get; set; } = "Pending";

        [Column("create_at")]
        public DateTime? create_at { get; set; } = DateTime.Now;

        [Required]
        [Column("total_amount", TypeName = "decimal(15,2)")]
        public decimal total_amount { get; set; }

        [Required]
        [Column("address")]
        [MaxLength(255)]
        public string address { get; set; }

        [Required]
        [Column("phone")]
        [MaxLength(20)]
        public string phone { get; set; }

        [Required]
        [Column("payment_method")]
        [MaxLength(50)]
        public string payment_method { get; set; }
    }
}
