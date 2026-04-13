using Microsoft.EntityFrameworkCore;
using TechStore_BE.Models;

namespace TechStore_BE.DataConnection
{
    public class ApplicationDBContext : DbContext
    {
        public ApplicationDBContext(DbContextOptions<ApplicationDBContext> options)
            : base(options)
        {
        }

        public DbSet<Users> Users { get; set; }
        public DbSet<Categories> Categories { get; set; }
        public DbSet<Brands> Brands { get; set; }
        public DbSet<Products> Products { get; set; }
        public DbSet<Carts> Carts { get; set; }
        public DbSet<Orders> Orders { get; set; }
        public DbSet<Order_Details> Order_Details { get; set; }
        public DbSet<ProductReviews> ProductReviews { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Users>()
                .HasIndex(u => u.username)
                .IsUnique();

            modelBuilder.Entity<Users>()
                .HasIndex(u => u.email)
                .IsUnique();

            modelBuilder.Entity<Brands>()
                .HasOne(b => b.category)
                .WithMany(c => c.Brands)
                .HasForeignKey(b => b.category_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Brands>()
                .HasIndex(b => new { b.category_id, b.brand_name })
                .IsUnique();

            modelBuilder.Entity<Products>()
                .HasOne(p => p.Brand)
                .WithMany()
                .HasForeignKey(p => p.brand_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Products>()
                .HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.category_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Products>()
                .Property(p => p.price)
                .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<Products>()
                .HasIndex(p => new { p.category_id, p.brand_id, p.price });

            modelBuilder.Entity<Carts>()
                .HasOne(c => c.Product)
                .WithMany()
                .HasForeignKey(c => c.product_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Carts>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.user_id)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Carts>()
                .HasIndex(c => new { c.user_id, c.product_id })
                .IsUnique();

            modelBuilder.Entity<Orders>()
                .HasOne(o => o.User)
                .WithMany(u => u.Orders)
                .HasForeignKey(o => o.user_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Orders>()
                .Property(o => o.total_amount)
                .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<Order_Details>()
                .HasOne(od => od.Order)
                .WithMany()
                .HasForeignKey(od => od.order_id)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Order_Details>()
                .HasOne(od => od.Product)
                .WithMany()
                .HasForeignKey(od => od.product_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Order_Details>()
                .Property(od => od.price)
                .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<Order_Details>()
                .Property(od => od.total_money)
                .HasColumnType("decimal(15,2)");

            modelBuilder.Entity<Order_Details>()
                .HasIndex(od => od.order_id);

            modelBuilder.Entity<ProductReviews>()
                .HasOne(r => r.Product)
                .WithMany(p => p.ProductReviews)
                .HasForeignKey(r => r.product_id)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProductReviews>()
                .HasOne(r => r.User)
                .WithMany(u => u.ProductReviews)
                .HasForeignKey(r => r.user_id)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ProductReviews>()
                .HasIndex(r => new { r.user_id, r.product_id })
                .IsUnique();
        }
    }
}
