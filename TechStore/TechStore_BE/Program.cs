using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Newtonsoft.Json.Serialization;
using TechStore_BE.DataConnection;
using TechStore_BE.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
// builder.Services.AddControllers(); // Removed redundant call
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "TechStore API",
        Version = "v1",
        Description = "API cho hệ thống cửa hàng công nghệ TechStore. Hỗ trợ quản lý sản phẩm, đơn hàng và người dùng.",
        Contact = new Microsoft.OpenApi.Models.OpenApiContact
        {
            Name = "TechStore Support",
            Email = "support@techstore.com"
        }
    });

    // Tích hợp XML Comments
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }
});

// ✅ Kết nối SQL Server
builder.Services.AddDbContext<ApplicationDBContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("QLSaling"));
});

// ✅ Cấu hình Email Service
builder.Services.Configure<Email>(builder.Configuration.GetSection("Email"));
builder.Services.AddScoped<EmailService>();

// ✅ Session
builder.Services.AddSession(options =>
{
    options.Cookie.Name = ".TechStore.Session";
    options.IdleTimeout = TimeSpan.FromMinutes(30);
});

// ✅ CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowOrigin", policy =>
    {
        policy.WithOrigins(
            "http://localhost:4200",
            "https://localhost:4200",
            "http://127.0.0.1:4200",
            "https://127.0.0.1:4200",
            "https://tech-store-23eda.web.app"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials();
    });
});

// ✅ Cookie
builder.Services.Configure<CookiePolicyOptions>(options =>
{
    options.CheckConsentNeeded = context => true;
    options.MinimumSameSitePolicy = SameSiteMode.None;
});

// ✅ JSON Config
builder.Services.AddControllersWithViews()
    .AddNewtonsoftJson(options =>
    {
        options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
        options.SerializerSettings.ContractResolver = new DefaultContractResolver();
    });

// ✅ Thêm URL để chạy được HTTPS
builder.WebHost.UseUrls(
    "http://localhost:5000",
    "https://localhost:7139"
);

var app = builder.Build();

// ✅ Bật Swagger + UI (Luôn luôn bật để tiện test)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "TechStore API v1");
    c.RoutePrefix = "swagger"; // mở tại /swagger
});

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

if (!app.Environment.IsDevelopment())
{
    // app.UseHttpsRedirection(); // Commented out to prevent CORS issues with preflight redirect
}
app.UseStaticFiles();
app.UseRouting();
app.UseCors("AllowOrigin");
app.UseSession();
app.UseAuthorization();

// ✅ Map Controllers
app.MapControllers();

// ✅ Chạy app
app.Run();
