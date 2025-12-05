using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models; // Thêm cái này để cấu hình Swagger

namespace BackEnd
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            // --- 1. CẤU HÌNH JWT ---
            var jwtSettings = builder.Configuration.GetSection("JwtSettings").Get<JwtSettings>();

            // Kiểm tra null để tránh lỗi crash nếu quên cấu hình appsettings
            if (jwtSettings == null) throw new Exception("Chưa cấu hình JwtSettings trong appsettings.json");

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

            // --- 2. CẤU HÌNH CORS ---
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", builder =>
                {
                    builder.AllowAnyOrigin()
                           .AllowAnyMethod()
                           .AllowAnyHeader();
                });
            });

            // --- 3. KẾT NỐI SQL SERVER (Lấy từ appsettings.json) ---
            // Thay vì viết cứng, hãy đọc từ file cấu hình cho chuyên nghiệp
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                                   ?? "Server=ADMIN-PC\\MSSQLSERVER22;Database=FashionShopDB;Trusted_Connection=True;TrustServerCertificate=True;";

            builder.Services.AddDbContext<FashionShopDbContext>(options =>
                options.UseSqlServer(connectionString));

            // --- 4. FIX LỖI LOOP JSON ---
            builder.Services.AddControllers().AddJsonOptions(x =>
                x.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles);

            builder.Services.AddEndpointsApiExplorer();

            // --- 5. CẤU HÌNH SWAGGER CÓ NÚT AUTHORIZE (Quan Trọng) ---
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo { Title = "FashionShop API", Version = "v1" });

                // Định nghĩa bảo mật Bearer
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Nhập token vào đây: Bearer {token}",
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

            // --- PIPELINE ---
            app.UseCors("AllowAll"); // CORS phải đứng đầu

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseAuthentication(); // Xác thực (Bạn là ai?)
            app.UseAuthorization();  // Phân quyền (Bạn được làm gì?)

            app.MapControllers();

            app.Run();
        }
    }
}