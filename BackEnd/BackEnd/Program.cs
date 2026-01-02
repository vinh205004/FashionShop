using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;

namespace BackEnd
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // ==========================================
            // 1. CẤU HÌNH JWT (XÁC THỰC)
            // ==========================================
            var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();
            if (jwtSettings == null) throw new Exception("⚠️ Lỗi: Chưa cấu hình JwtSettings trong appsettings.json");

            builder.Services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            }).AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtSettings.Issuer,
                    ValidAudience = jwtSettings.Audience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key))
                };
            });

            builder.Services.AddAuthorization();

            // ==========================================
            // 2. CẤU HÌNH CORS (CHO PHÉP REACT GỌI API)
            // ==========================================
            builder.Services.AddCors(options =>
            {
                options.AddDefaultPolicy(policy =>
                {
                    // Cho phép đúng địa chỉ của React (Frontend)
                    policy.WithOrigins("http://localhost:5173")
                          .AllowAnyMethod()
                          .AllowAnyHeader();
                });
            });

            // ==========================================
            // 3. KẾT NỐI DATABASE
            // ==========================================
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                ?? "Server=ADMIN-PC\\MSSQLSERVER22;Database=FashionShopDB;Trusted_Connection=True;TrustServerCertificate=True;";

            builder.Services.AddDbContext<FashionShopDbContext>(options =>
                options.UseSqlServer(connectionString));

            // ==========================================
            // 4. FIX LỖI LOOP JSON & CONTROLLERS
            // ==========================================
            builder.Services.AddControllers().AddJsonOptions(x =>
                x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

            builder.Services.AddEndpointsApiExplorer();

            // ==========================================
            // 5. CẤU HÌNH SWAGGER (CÓ NÚT NHẬP TOKEN)
            // ==========================================
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "FashionShop API", Version = "v1" });

                // Định nghĩa nút Authorize (Ổ khóa)
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập token theo cú pháp: Bearer {token}",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer"
                });

                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
            });

            var app = builder.Build();

            // ==========================================
            // 6. PIPELINE (LUỒNG XỬ LÝ)
            // ==========================================

            // 1. CORS phải đứng đầu để chặn/cho phép ngay từ cửa
            app.UseCors();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            // 2. Cho phép truy cập ảnh tĩnh (trong folder wwwroot)
            // Cần thiết cho tính năng hiển thị ảnh sản phẩm sau này
            app.UseStaticFiles();

            // 3. Xác thực & Phân quyền
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}