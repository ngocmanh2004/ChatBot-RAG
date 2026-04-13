using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TechStore_BE.Migrations
{
    /// <inheritdoc />
    public partial class AddProductPerformanceSpecs : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Brands_Categories_category_id",
                table: "Brands");

            migrationBuilder.DropForeignKey(
                name: "FK_Cart_Products_product_id",
                table: "Cart");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Details_Products_product_id",
                table: "Order_Details");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_user_id",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_user_id",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_user_id",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Products_category_id",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Cart_user_id",
                table: "Cart");

            migrationBuilder.DropIndex(
                name: "IX_Brands_category_id",
                table: "Brands");

            migrationBuilder.AlterColumn<string>(
                name: "username",
                table: "Users",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "email",
                table: "Users",
                type: "nvarchar(450)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "price",
                table: "Products",
                type: "decimal(15,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<int>(
                name: "battery_mah",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "cpu_chip",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "fast_charge_w",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "front_camera_mp",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "gpu",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ram_gb",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "rear_camera_mp",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "refresh_rate_hz",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "screen_resolution",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "screen_size_inch",
                table: "Products",
                type: "decimal(18,2)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "storage_gb",
                table: "Products",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "total_money",
                table: "Order_Details",
                type: "decimal(15,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "price",
                table: "Order_Details",
                type: "decimal(15,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<int>(
                name: "Productsproduct_id",
                table: "Order_Details",
                type: "int",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "brand_name",
                table: "Brands",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.CreateIndex(
                name: "IX_Users_email",
                table: "Users",
                column: "email",
                unique: true,
                filter: "[email] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Users_username",
                table: "Users",
                column: "username",
                unique: true,
                filter: "[username] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_user_id_product_id",
                table: "Reviews",
                columns: new[] { "user_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Products_category_id_brand_id_price",
                table: "Products",
                columns: new[] { "category_id", "brand_id", "price" });

            migrationBuilder.CreateIndex(
                name: "IX_Order_Details_Productsproduct_id",
                table: "Order_Details",
                column: "Productsproduct_id");

            migrationBuilder.CreateIndex(
                name: "IX_Cart_user_id_product_id",
                table: "Cart",
                columns: new[] { "user_id", "product_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Brands_category_id_brand_name",
                table: "Brands",
                columns: new[] { "category_id", "brand_name" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Brands_Categories_category_id",
                table: "Brands",
                column: "category_id",
                principalTable: "Categories",
                principalColumn: "category_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Cart_Products_product_id",
                table: "Cart",
                column: "product_id",
                principalTable: "Products",
                principalColumn: "product_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Details_Products_Productsproduct_id",
                table: "Order_Details",
                column: "Productsproduct_id",
                principalTable: "Products",
                principalColumn: "product_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Details_Products_product_id",
                table: "Order_Details",
                column: "product_id",
                principalTable: "Products",
                principalColumn: "product_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_user_id",
                table: "Orders",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "user_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_user_id",
                table: "Reviews",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "user_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Brands_Categories_category_id",
                table: "Brands");

            migrationBuilder.DropForeignKey(
                name: "FK_Cart_Products_product_id",
                table: "Cart");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Details_Products_Productsproduct_id",
                table: "Order_Details");

            migrationBuilder.DropForeignKey(
                name: "FK_Order_Details_Products_product_id",
                table: "Order_Details");

            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Users_user_id",
                table: "Orders");

            migrationBuilder.DropForeignKey(
                name: "FK_Reviews_Users_user_id",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Users_email",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Users_username",
                table: "Users");

            migrationBuilder.DropIndex(
                name: "IX_Reviews_user_id_product_id",
                table: "Reviews");

            migrationBuilder.DropIndex(
                name: "IX_Products_category_id_brand_id_price",
                table: "Products");

            migrationBuilder.DropIndex(
                name: "IX_Order_Details_Productsproduct_id",
                table: "Order_Details");

            migrationBuilder.DropIndex(
                name: "IX_Cart_user_id_product_id",
                table: "Cart");

            migrationBuilder.DropIndex(
                name: "IX_Brands_category_id_brand_name",
                table: "Brands");

            migrationBuilder.DropColumn(
                name: "battery_mah",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "cpu_chip",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "fast_charge_w",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "front_camera_mp",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "gpu",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "ram_gb",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "rear_camera_mp",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "refresh_rate_hz",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "screen_resolution",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "screen_size_inch",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "storage_gb",
                table: "Products");

            migrationBuilder.DropColumn(
                name: "Productsproduct_id",
                table: "Order_Details");

            migrationBuilder.AlterColumn<string>(
                name: "username",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "email",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "price",
                table: "Products",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "total_money",
                table: "Order_Details",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)");

            migrationBuilder.AlterColumn<decimal>(
                name: "price",
                table: "Order_Details",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(15,2)");

            migrationBuilder.AlterColumn<string>(
                name: "brand_name",
                table: "Brands",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)");

            migrationBuilder.CreateIndex(
                name: "IX_Reviews_user_id",
                table: "Reviews",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Products_category_id",
                table: "Products",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_Cart_user_id",
                table: "Cart",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_Brands_category_id",
                table: "Brands",
                column: "category_id");

            migrationBuilder.AddForeignKey(
                name: "FK_Brands_Categories_category_id",
                table: "Brands",
                column: "category_id",
                principalTable: "Categories",
                principalColumn: "category_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Cart_Products_product_id",
                table: "Cart",
                column: "product_id",
                principalTable: "Products",
                principalColumn: "product_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Order_Details_Products_product_id",
                table: "Order_Details",
                column: "product_id",
                principalTable: "Products",
                principalColumn: "product_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Users_user_id",
                table: "Orders",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Reviews_Users_user_id",
                table: "Reviews",
                column: "user_id",
                principalTable: "Users",
                principalColumn: "user_id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
