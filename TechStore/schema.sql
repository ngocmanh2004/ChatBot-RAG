/*
  TechStore full bootstrap script
  - Drop/Create DB
  - Create tables, constraints, indexes
  - Seed initial data

  Run this script in SQL Server Management Studio.
*/

SET NOCOUNT ON;
GO

IF DB_ID(N'TechStore') IS NOT NULL
BEGIN
    ALTER DATABASE TechStore SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE TechStore;
END
GO

CREATE DATABASE TechStore;
GO

USE TechStore;
GO

/* =========================
   1) MASTER TABLES
   ========================= */
CREATE TABLE dbo.Categories (
    category_id      INT IDENTITY(1,1) NOT NULL,
    category_name    NVARCHAR(100) NOT NULL,
    is_active        BIT NOT NULL CONSTRAINT DF_Categories_IsActive DEFAULT (1),
    created_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Categories_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Categories_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Categories PRIMARY KEY CLUSTERED (category_id),
    CONSTRAINT UQ_Categories_Name UNIQUE (category_name)
);
GO

CREATE TABLE dbo.Brands (
    brand_id         INT IDENTITY(1,1) NOT NULL,
    brand_name       NVARCHAR(120) NOT NULL,
    category_id      INT NOT NULL,
    is_active        BIT NOT NULL CONSTRAINT DF_Brands_IsActive DEFAULT (1),
    created_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Brands_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Brands_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Brands PRIMARY KEY CLUSTERED (brand_id),
    CONSTRAINT FK_Brands_Categories FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT UQ_Brands_CategoryName UNIQUE (category_id, brand_name)
);
GO

CREATE TABLE dbo.Users (
    user_id          INT IDENTITY(1,1) NOT NULL,
    username         NVARCHAR(120) NOT NULL,
    email            NVARCHAR(255) NOT NULL,
    phone            NVARCHAR(20) NULL,
    [password]       NVARCHAR(255) NOT NULL,
    [address]        NVARCHAR(255) NULL,
    create_at        DATETIME2(0) NOT NULL CONSTRAINT DF_Users_CreateAt DEFAULT (SYSUTCDATETIME()),
    role_id          INT NOT NULL CONSTRAINT DF_Users_Role DEFAULT (2), -- 1 Admin, 2 User
    is_active        BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT (1),
    CONSTRAINT PK_Users PRIMARY KEY CLUSTERED (user_id),
    CONSTRAINT CK_Users_Role CHECK (role_id IN (1,2)),
    CONSTRAINT UQ_Users_Username UNIQUE (username),
    CONSTRAINT UQ_Users_Email UNIQUE (email)
);
GO

CREATE TABLE dbo.Products (
    product_id       INT IDENTITY(1,1) NOT NULL,
    product_name     NVARCHAR(255) NOT NULL,
    brand_id         INT NOT NULL,
    category_id      INT NOT NULL,
    price            DECIMAL(15,2) NOT NULL,
    quantity         INT NOT NULL,
    [description]    NVARCHAR(1500) NULL,
    image_url        NVARCHAR(500) NULL,
    sku              NVARCHAR(64) NULL,
    cpu_chip         NVARCHAR(150) NULL,
    gpu              NVARCHAR(150) NULL,
    ram_gb           INT NULL,
    storage_gb       INT NULL,
    battery_mah      INT NULL,
    fast_charge_w    INT NULL,
    rear_camera_mp   DECIMAL(6,2) NULL,
    front_camera_mp  DECIMAL(6,2) NULL,
    screen_size_inch DECIMAL(4,2) NULL,
    screen_resolution NVARCHAR(50) NULL,
    refresh_rate_hz  INT NULL,
    is_active        BIT NOT NULL CONSTRAINT DF_Products_IsActive DEFAULT (1),
    created_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Products_CreatedAt DEFAULT (SYSUTCDATETIME()),
    updated_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Products_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Products PRIMARY KEY CLUSTERED (product_id),
    CONSTRAINT FK_Products_Brands FOREIGN KEY (brand_id) REFERENCES dbo.Brands(brand_id),
    CONSTRAINT FK_Products_Categories FOREIGN KEY (category_id) REFERENCES dbo.Categories(category_id),
    CONSTRAINT CK_Products_Price CHECK (price >= 0),
    CONSTRAINT CK_Products_Quantity CHECK (quantity >= 0),
    CONSTRAINT CK_Products_RAM CHECK (ram_gb IS NULL OR ram_gb > 0),
    CONSTRAINT CK_Products_Storage CHECK (storage_gb IS NULL OR storage_gb > 0),
    CONSTRAINT CK_Products_Battery CHECK (battery_mah IS NULL OR battery_mah > 0),
    CONSTRAINT CK_Products_Refresh CHECK (refresh_rate_hz IS NULL OR refresh_rate_hz > 0)
);
GO

/* =========================
   2) TRANSACTION TABLES
   ========================= */
CREATE TABLE dbo.Cart (
    cart_id          INT IDENTITY(1,1) NOT NULL,
    product_id       INT NOT NULL,
    user_id          INT NOT NULL,
    quantity         INT NOT NULL,
    added_at         DATETIME2(0) NOT NULL CONSTRAINT DF_Cart_AddedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Cart PRIMARY KEY CLUSTERED (cart_id),
    CONSTRAINT FK_Cart_Products FOREIGN KEY (product_id) REFERENCES dbo.Products(product_id),
    CONSTRAINT FK_Cart_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT CK_Cart_Quantity CHECK (quantity > 0)
);
GO

CREATE TABLE dbo.Orders (
    order_id         INT IDENTITY(1,1) NOT NULL,
    user_id          INT NOT NULL,
    full_name        NVARCHAR(120) NOT NULL,
    order_status     NVARCHAR(30) NOT NULL CONSTRAINT DF_Orders_Status DEFAULT (N'Chờ xác nhận'),
    create_at        DATETIME2(0) NOT NULL CONSTRAINT DF_Orders_CreateAt DEFAULT (SYSUTCDATETIME()),
    total_amount     DECIMAL(15,2) NOT NULL,
    [address]        NVARCHAR(255) NOT NULL,
    phone            NVARCHAR(20) NOT NULL,
    payment_method   NVARCHAR(50) NOT NULL,
    note             NVARCHAR(500) NULL,
    updated_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Orders_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Orders PRIMARY KEY CLUSTERED (order_id),
    CONSTRAINT FK_Orders_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT CK_Orders_TotalAmount CHECK (total_amount >= 0),
    CONSTRAINT CK_Orders_Status CHECK (order_status IN (
        N'Chờ xác nhận', N'Đang xử lý', N'Đã xác nhận', N'Đang giao', N'Đã giao', N'Đã hủy'
    )),
    CONSTRAINT CK_Orders_PaymentMethod CHECK (payment_method IN (
        N'COD', N'BANK_TRANSFER', N'VNPAY', N'CREDIT_CARD'
    ))
);
GO

CREATE TABLE dbo.Order_Details (
    id               INT IDENTITY(1,1) NOT NULL,
    order_id         INT NOT NULL,
    product_id       INT NOT NULL,
    price            DECIMAL(15,2) NOT NULL,
    number_of_products INT NOT NULL,
    total_money      DECIMAL(15,2) NOT NULL,
    product_name     NVARCHAR(255) NULL,
    image_path       NVARCHAR(500) NULL,
    CONSTRAINT PK_Order_Details PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_OrderDetails_Orders FOREIGN KEY (order_id) REFERENCES dbo.Orders(order_id),
    CONSTRAINT FK_OrderDetails_Products FOREIGN KEY (product_id) REFERENCES dbo.Products(product_id),
    CONSTRAINT CK_OrderDetails_Price CHECK (price >= 0),
    CONSTRAINT CK_OrderDetails_NumberOfProducts CHECK (number_of_products > 0),
    CONSTRAINT CK_OrderDetails_TotalMoney CHECK (total_money >= 0)
);
GO

CREATE TABLE dbo.Reviews (
    id               INT IDENTITY(1,1) NOT NULL,
    product_id       INT NOT NULL,
    user_id          INT NOT NULL,
    content          NVARCHAR(1000) NOT NULL,
    rating           INT NOT NULL,
    create_at        DATETIME2(0) NOT NULL CONSTRAINT DF_Reviews_CreateAt DEFAULT (SYSUTCDATETIME()),
    updated_at       DATETIME2(0) NOT NULL CONSTRAINT DF_Reviews_UpdatedAt DEFAULT (SYSUTCDATETIME()),
    CONSTRAINT PK_Reviews PRIMARY KEY CLUSTERED (id),
    CONSTRAINT FK_Reviews_Products FOREIGN KEY (product_id) REFERENCES dbo.Products(product_id),
    CONSTRAINT FK_Reviews_Users FOREIGN KEY (user_id) REFERENCES dbo.Users(user_id),
    CONSTRAINT CK_Reviews_Rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT UQ_Reviews_User_Product UNIQUE (user_id, product_id)
);
GO

/* =========================
   3) PERFORMANCE INDEXES
   ========================= */
CREATE NONCLUSTERED INDEX IX_Products_Category_Brand_Price
ON dbo.Products(category_id, brand_id, price)
INCLUDE (product_name, quantity, image_url);
GO

CREATE NONCLUSTERED INDEX IX_Products_Name
ON dbo.Products(product_name);
GO

CREATE NONCLUSTERED INDEX IX_Products_PerformanceFilters
ON dbo.Products(category_id, price, ram_gb, battery_mah, rear_camera_mp, refresh_rate_hz)
INCLUDE (product_name, cpu_chip, gpu, storage_gb, screen_resolution);
GO

CREATE NONCLUSTERED INDEX IX_Brands_Category
ON dbo.Brands(category_id);
GO

CREATE UNIQUE NONCLUSTERED INDEX IX_Cart_User_Product
ON dbo.Cart(user_id, product_id);
GO

CREATE NONCLUSTERED INDEX IX_Cart_User_AddedAt
ON dbo.Cart(user_id, added_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_Orders_User_CreateAt
ON dbo.Orders(user_id, create_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_Orders_Status_CreateAt
ON dbo.Orders(order_status, create_at DESC);
GO

CREATE NONCLUSTERED INDEX IX_OrderDetails_OrderId
ON dbo.Order_Details(order_id);
GO

CREATE NONCLUSTERED INDEX IX_OrderDetails_ProductId
ON dbo.Order_Details(product_id);
GO

CREATE NONCLUSTERED INDEX IX_Reviews_Product_CreateAt
ON dbo.Reviews(product_id, create_at DESC);
GO

/* =========================
   4) SEED DATA
   ========================= */
INSERT INTO dbo.Categories (category_name) VALUES
(N'Điện thoại'),
(N'Laptop'),
(N'Máy tính bảng'),
(N'Phụ kiện');
GO

INSERT INTO dbo.Brands (brand_name, category_id) VALUES
-- phones
(N'Apple', 1), (N'Samsung', 1), (N'Xiaomi', 1), (N'OPPO', 1), (N'Vivo', 1), (N'Huawei', 1), (N'Realme', 1), (N'OnePlus', 1),
-- laptops
(N'Dell', 2), (N'HP', 2), (N'Lenovo', 2), (N'Asus', 2), (N'Acer', 2), (N'MSI', 2), (N'Apple', 2),
-- tablets
(N'Apple', 3), (N'Samsung', 3), (N'Xiaomi', 3), (N'Huawei', 3), (N'Lenovo', 3),
-- accessories
(N'Logitech', 4), (N'Anker', 4), (N'Apple', 4), (N'Samsung', 4), (N'Sony', 4), (N'Baseus', 4), (N'Razer', 4);
GO

INSERT INTO dbo.Users (username, email, phone, [password], [address], role_id) VALUES
(N'admin', N'admin@techstore.vn', N'0900000001', N'123456', N'TP.HCM', 1),
(N'manh', N'manh@techstore.vn', N'0900000002', N'123456', N'Đà Nẵng', 2),
(N'linh', N'linh@techstore.vn', N'0900000003', N'123456', N'Hà Nội', 2),
(N'khanh', N'khanh@techstore.vn', N'0900000004', N'123456', N'Cần Thơ', 2);
GO

/* Phone products (category_id = 1, brand_id from phone brands 1..8) */
INSERT INTO dbo.Products (product_name, brand_id, category_id, price, quantity, [description], image_url, sku) VALUES
(N'iPhone 15 Pro Max', 1, 1, 21000000, 10, N'Smartphone cao cấp của Apple', N'iphone15.jpeg', N'P-IPH15PM'),
(N'Samsung Galaxy S23 Ultra', 2, 1, 19000000, 15, N'Màn hình lớn, hiệu năng mạnh mẽ', N'galaxyS23.jpg', N'P-SS23U'),
(N'Xiaomi Mi 11', 3, 1, 5590000, 17, N'Smartphone cấu hình tốt, camera đẹp', N'mi11.jpeg', N'P-XM11'),
(N'iPhone 14', 1, 1, 18900000, 14, N'iPhone 14 màn đẹp, hiệu năng ổn định', N'iphone14.jpg', N'P-IPH14'),
(N'Samsung Galaxy A54', 2, 1, 8990000, 20, N'Pin 5000mAh, màn hình đẹp', N'galaxyA54.jpeg', N'P-SA54'),
(N'Xiaomi Redmi Note 12', 3, 1, 5590000, 25, N'Màn hình AMOLED 120Hz, pin lớn', N'redminote12.jpeg', N'P-XRN12'),
(N'Huawei Nova 11i', 6, 1, 6390000, 18, N'Thiết kế mỏng nhẹ, pin tốt', N'nova11i.jpg', N'P-HN11I'),
(N'iPhone SE 2022', 1, 1, 11490000, 10, N'iPhone nhỏ gọn, chip mạnh', N'iphonese2022.jpeg', N'P-IPHSE22'),
(N'OPPO Reno 10', 4, 1, 11990000, 11, N'Màn hình đẹp, camera chân dung tốt', N'reno10.jpeg', N'P-OR10'),
(N'Vivo V27', 5, 1, 10990000, 9, N'Camera selfie nổi bật', N'vivov27.jpeg', N'P-VV27'),
(N'Realme 11 Pro+', 7, 1, 12490000, 12, N'Hiệu năng tốt, sạc nhanh', N'realme11proplus.jpeg', N'P-R11PP'),
(N'OnePlus Nord 3', 8, 1, 12990000, 8, N'Chip mạnh, trải nghiệm mượt', N'nord3.jpeg', N'P-ON3');
GO

/* Laptop products (category_id = 2, laptop brand_id from 9..15) */
INSERT INTO dbo.Products (product_name, brand_id, category_id, price, quantity, [description], image_url, sku) VALUES
(N'Dell XPS 13', 9, 2, 20000000, 8, N'Ultrabook cao cấp mỏng nhẹ', N'dellxps13.jpeg', N'L-DXPS13'),
(N'HP Spectre x360', 10, 2, 19990000, 12, N'Laptop 2-trong-1 cao cấp', N'hpspectre.jpeg', N'L-HPSX360'),
(N'Lenovo ThinkPad X1', 11, 2, 17890000, 7, N'Dòng máy doanh nhân bền bỉ', N'thinkpadx1.jpeg', N'L-LTPX1'),
(N'Asus ROG Zephyrus', 12, 2, 14599000, 5, N'Laptop gaming mỏng nhẹ', N'asusrog.jpg', N'L-ARZ'),
(N'Dell Inspiron 15', 9, 2, 23690000, 14, N'Laptop học tập, văn phòng phổ thông', N'inspiron15.jpeg', N'L-DINS15'),
(N'HP Pavilion 14', 10, 2, 9990000, 11, N'Laptop thiết kế đẹp, cấu hình ổn', N'pavilion14.jpeg', N'L-HPV14'),
(N'Lenovo Yoga Slim 7', 11, 2, 17890000, 13, N'Mỏng nhẹ, hiệu năng ổn định', N'yogaslim7.jpeg', N'L-LYS7'),
(N'Asus VivoBook 15', 12, 2, 14590000, 10, N'Màn lớn, giá hợp lý', N'vivobook15.jpeg', N'L-AVB15'),
(N'Dell Latitude 5420', 9, 2, 23900000, 6, N'Laptop doanh nhân bền bỉ', N'latitude5420.jpeg', N'L-DL5420'),
(N'HP Envy 13', 10, 2, 17900000, 9, N'Mỏng nhẹ, màn đẹp', N'envy13.jpg', N'L-HENVY13'),
(N'Lenovo IdeaPad 5', 11, 2, 13900000, 15, N'Phổ thông cân bằng hiệu năng', N'ideapad5.jpeg', N'L-LIP5'),
(N'Asus TUF Gaming F15', 12, 2, 16990000, 7, N'Gaming tầm trung hiệu năng cao', N'tufgaming.jpeg', N'L-ATUF15');
GO

/* Tablet products (category_id = 3, tablet brand_id from 16..20) */
INSERT INTO dbo.Products (product_name, brand_id, category_id, price, quantity, [description], image_url, sku) VALUES
(N'iPad Pro 12.9', 16, 3, 12990000, 6, N'Máy tính bảng hiệu năng cao', N'ipadpro.jpeg', N'T-IPADPRO129'),
(N'Xiaomi Pad 6', 18, 3, 8990000, 20, N'Pin trâu, màn hình đẹp', N'xiaomipad.jpeg', N'T-XPAD6'),
(N'Huawei MatePad Pro', 19, 3, 4990000, 9, N'Thiết kế cao cấp', N'matepad.jpeg', N'T-HMPRO'),
(N'Samsung Galaxy Tab S8', 17, 3, 8590000, 10, N'Hỗ trợ S Pen, đa nhiệm tốt', N'galaxytabs8.jpeg', N'T-GTS8'),
(N'iPad mini 6', 16, 3, 14900000, 8, N'Nhỏ gọn, hiệu năng tốt', N'ipadmini6.jpeg', N'T-IPADMINI6');
GO

/* Accessories (category_id = 4, accessory brand_id from 21..27) */
INSERT INTO dbo.Products (product_name, brand_id, category_id, price, quantity, [description], image_url, sku) VALUES
(N'Logitech MX Master 3', 21, 4, 999000, 30, N'Chuột không dây cao cấp', N'mxmaster3.jpeg', N'A-LMXM3'),
(N'Anker PowerCore 20000', 22, 4, 3100000, 25, N'Pin sạc dự phòng dung lượng lớn', N'ankerpowercore.jpeg', N'A-APC20K'),
(N'Apple AirPods Pro', 23, 4, 2590000, 18, N'Tai nghe chống ồn chủ động', N'airpodspro.jpeg', N'A-AAPP'),
(N'Samsung Galaxy Buds 2', 24, 4, 1790000, 22, N'Tai nghe true wireless', N'galaxybuds2.jpeg', N'A-SGB2'),
(N'Sony WH-1000XM4', 25, 4, 5990000, 12, N'Tai nghe chống ồn cao cấp', N'sonyxm4.jpeg', N'A-SXM4'),
(N'Baseus 65W GaN Charger', 26, 4, 990000, 28, N'Sạc nhanh đa cổng', N'baseus65w.jpeg', N'A-B65W'),
(N'Razer DeathAdder V2', 27, 4, 1290000, 20, N'Chuột gaming cảm biến chuẩn', N'razerda2.jpeg', N'A-RDA2');
GO

/* =========================
   5) PERFORMANCE SPECS SEED
   ========================= */
UPDATE dbo.Products
SET
    cpu_chip = N'Apple A17 Pro',
    gpu = N'Apple GPU 6-core',
    ram_gb = 8,
    storage_gb = 256,
    battery_mah = 4441,
    fast_charge_w = 27,
    rear_camera_mp = 48,
    front_camera_mp = 12,
    screen_size_inch = 6.70,
    screen_resolution = N'2796x1290',
    refresh_rate_hz = 120
WHERE product_name = N'iPhone 15 Pro Max';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 8 Gen 2 for Galaxy',
    gpu = N'Adreno 740',
    ram_gb = 12,
    storage_gb = 256,
    battery_mah = 5000,
    fast_charge_w = 45,
    rear_camera_mp = 200,
    front_camera_mp = 12,
    screen_size_inch = 6.80,
    screen_resolution = N'3088x1440',
    refresh_rate_hz = 120
WHERE product_name = N'Samsung Galaxy S23 Ultra';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 888',
    gpu = N'Adreno 660',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 4600,
    fast_charge_w = 55,
    rear_camera_mp = 108,
    front_camera_mp = 20,
    screen_size_inch = 6.81,
    screen_resolution = N'3200x1440',
    refresh_rate_hz = 120
WHERE product_name = N'Xiaomi Mi 11';

UPDATE dbo.Products
SET
    cpu_chip = N'Apple A15 Bionic',
    gpu = N'Apple GPU 5-core',
    ram_gb = 6,
    storage_gb = 128,
    battery_mah = 3279,
    fast_charge_w = 20,
    rear_camera_mp = 12,
    front_camera_mp = 12,
    screen_size_inch = 6.10,
    screen_resolution = N'2532x1170',
    refresh_rate_hz = 60
WHERE product_name = N'iPhone 14';

UPDATE dbo.Products
SET
    cpu_chip = N'Exynos 1380',
    gpu = N'Mali-G68 MP5',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 5000,
    fast_charge_w = 25,
    rear_camera_mp = 50,
    front_camera_mp = 32,
    screen_size_inch = 6.40,
    screen_resolution = N'2340x1080',
    refresh_rate_hz = 120
WHERE product_name = N'Samsung Galaxy A54';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 685',
    gpu = N'Adreno 610',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 5000,
    fast_charge_w = 33,
    rear_camera_mp = 50,
    front_camera_mp = 13,
    screen_size_inch = 6.67,
    screen_resolution = N'2400x1080',
    refresh_rate_hz = 120
WHERE product_name = N'Xiaomi Redmi Note 12';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 680',
    gpu = N'Adreno 610',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 5000,
    fast_charge_w = 40,
    rear_camera_mp = 48,
    front_camera_mp = 16,
    screen_size_inch = 6.80,
    screen_resolution = N'2388x1080',
    refresh_rate_hz = 90
WHERE product_name = N'Huawei Nova 11i';

UPDATE dbo.Products
SET
    cpu_chip = N'Apple A15 Bionic',
    gpu = N'Apple GPU 4-core',
    ram_gb = 4,
    storage_gb = 64,
    battery_mah = 2018,
    fast_charge_w = 20,
    rear_camera_mp = 12,
    front_camera_mp = 7,
    screen_size_inch = 4.70,
    screen_resolution = N'1334x750',
    refresh_rate_hz = 60
WHERE product_name = N'iPhone SE 2022';

UPDATE dbo.Products
SET
    cpu_chip = N'Dimensity 7050',
    gpu = N'Mali-G68 MC4',
    ram_gb = 8,
    storage_gb = 256,
    battery_mah = 5000,
    fast_charge_w = 67,
    rear_camera_mp = 64,
    front_camera_mp = 32,
    screen_size_inch = 6.70,
    screen_resolution = N'2412x1080',
    refresh_rate_hz = 120
WHERE product_name = N'OPPO Reno 10';

UPDATE dbo.Products
SET
    cpu_chip = N'Dimensity 7200',
    gpu = N'Mali-G610 MC4',
    ram_gb = 8,
    storage_gb = 256,
    battery_mah = 4600,
    fast_charge_w = 66,
    rear_camera_mp = 50,
    front_camera_mp = 50,
    screen_size_inch = 6.78,
    screen_resolution = N'2400x1080',
    refresh_rate_hz = 120
WHERE product_name = N'Vivo V27';

UPDATE dbo.Products
SET
    cpu_chip = N'Dimensity 7050',
    gpu = N'Mali-G68 MC4',
    ram_gb = 12,
    storage_gb = 512,
    battery_mah = 5000,
    fast_charge_w = 100,
    rear_camera_mp = 200,
    front_camera_mp = 32,
    screen_size_inch = 6.70,
    screen_resolution = N'2412x1080',
    refresh_rate_hz = 120
WHERE product_name = N'Realme 11 Pro+';

UPDATE dbo.Products
SET
    cpu_chip = N'Dimensity 9000',
    gpu = N'Mali-G710 MC10',
    ram_gb = 16,
    storage_gb = 256,
    battery_mah = 5000,
    fast_charge_w = 80,
    rear_camera_mp = 50,
    front_camera_mp = 16,
    screen_size_inch = 6.74,
    screen_resolution = N'2772x1240',
    refresh_rate_hz = 120
WHERE product_name = N'OnePlus Nord 3';

UPDATE dbo.Products
SET
    cpu_chip = N'Intel Core i7-1250U',
    gpu = N'Intel Iris Xe',
    ram_gb = 16,
    storage_gb = 512,
    battery_mah = 5100,
    rear_camera_mp = 0,
    front_camera_mp = 2,
    screen_size_inch = 13.40,
    screen_resolution = N'1920x1200',
    refresh_rate_hz = 60
WHERE product_name = N'Dell XPS 13';

UPDATE dbo.Products
SET
    cpu_chip = N'Intel Core i7-1355U',
    gpu = N'Intel Iris Xe',
    ram_gb = 16,
    storage_gb = 512,
    battery_mah = 6600,
    rear_camera_mp = 0,
    front_camera_mp = 5,
    screen_size_inch = 13.50,
    screen_resolution = N'1920x1280',
    refresh_rate_hz = 60
WHERE product_name = N'HP Spectre x360';

UPDATE dbo.Products
SET
    cpu_chip = N'Intel Core i7-1260P',
    gpu = N'Intel Iris Xe',
    ram_gb = 16,
    storage_gb = 512,
    battery_mah = 5700,
    rear_camera_mp = 0,
    front_camera_mp = 2,
    screen_size_inch = 14.00,
    screen_resolution = N'1920x1200',
    refresh_rate_hz = 60
WHERE product_name = N'Lenovo ThinkPad X1';

UPDATE dbo.Products
SET
    cpu_chip = N'AMD Ryzen 7 6800HS',
    gpu = N'NVIDIA RTX 3060',
    ram_gb = 16,
    storage_gb = 512,
    battery_mah = 7600,
    rear_camera_mp = 0,
    front_camera_mp = 2,
    screen_size_inch = 15.60,
    screen_resolution = N'2560x1440',
    refresh_rate_hz = 165
WHERE product_name = N'Asus ROG Zephyrus';

UPDATE dbo.Products
SET
    cpu_chip = N'Apple M2',
    gpu = N'Apple GPU 10-core',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 10758,
    rear_camera_mp = 12,
    front_camera_mp = 12,
    screen_size_inch = 12.90,
    screen_resolution = N'2732x2048',
    refresh_rate_hz = 120
WHERE product_name = N'iPad Pro 12.9';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 870',
    gpu = N'Adreno 650',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 8840,
    rear_camera_mp = 13,
    front_camera_mp = 8,
    screen_size_inch = 11.00,
    screen_resolution = N'2880x1800',
    refresh_rate_hz = 144
WHERE product_name = N'Xiaomi Pad 6';

UPDATE dbo.Products
SET
    cpu_chip = N'Snapdragon 8 Gen 1',
    gpu = N'Adreno 730',
    ram_gb = 8,
    storage_gb = 128,
    battery_mah = 8000,
    rear_camera_mp = 13,
    front_camera_mp = 12,
    screen_size_inch = 11.00,
    screen_resolution = N'2560x1600',
    refresh_rate_hz = 120
WHERE product_name = N'Samsung Galaxy Tab S8';
GO

INSERT INTO dbo.Cart (product_id, user_id, quantity) VALUES
(2, 2, 1),
(6, 2, 1),
(27, 3, 2);
GO

INSERT INTO dbo.Orders (user_id, full_name, order_status, total_amount, [address], phone, payment_method, note) VALUES
(2, N'Nguyễn Văn Mạnh', N'Đang xử lý', 28990000, N'Đà Nẵng', N'0900000002', N'COD', N'Gọi trước khi giao'),
(3, N'Nguyễn Thị Linh', N'Đã xác nhận', 12990000, N'Hà Nội', N'0900000003', N'BANK_TRANSFER', N'');
GO

INSERT INTO dbo.Order_Details (order_id, product_id, price, number_of_products, total_money, product_name, image_path) VALUES
(1, 2, 19000000, 1, 19000000, N'Samsung Galaxy S23 Ultra', N'galaxyS23.jpg'),
(1, 41, 999000, 1, 999000, N'Logitech MX Master 3', N'mxmaster3.jpeg'),
(1, 43, 2590000, 1, 2590000, N'Apple AirPods Pro', N'airpodspro.jpeg'),
(2, 31, 12990000, 1, 12990000, N'iPad Pro 12.9', N'ipadpro.jpeg');
GO

INSERT INTO dbo.Reviews (product_id, user_id, content, rating) VALUES
(2, 2, N'Hiệu năng rất tốt, chơi game mượt.', 5),
(5, 3, N'Pin trâu, dùng ổn định trong tầm giá.', 4),
(12, 4, N'Màn đẹp, dùng văn phòng khá ổn.', 4);
GO

PRINT N'Bootstrap TechStore database completed successfully.';
GO
