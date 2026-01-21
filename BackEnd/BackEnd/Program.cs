using Microsoft.EntityFrameworkCore;
using BackEnd.Models;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.OpenApi.Models;
using System.IdentityModel.Tokens.Jwt;
using Npgsql.EntityFrameworkCore.PostgreSQL;
using System.Security.Claims;

namespace BackEnd
{
    public class Program
    {
        public static void Main(string[] args)
        {
            AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
            var builder = WebApplication.CreateBuilder(args);
            // Đăng ký Cloudinary Service
            builder.Services.AddScoped<BackEnd.Services.ICloudinaryService, BackEnd.Services.CloudinaryService>();
            // ==========================================
            // 0. NGĂN .NET ĐỔI TÊN CLAIM
            // ==========================================
            // giữ nguyên tên claim là "UserId"
            JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();
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
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings.Key)),
                    RoleClaimType = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"
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
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

            if (string.IsNullOrEmpty(connectionString))
                throw new Exception("⚠️ Chưa cấu hình Connection String trong appsettings.json");

            builder.Services.AddDbContext<FashionShopDbContext>(options =>
                options.UseNpgsql(connectionString));

            // ==========================================
            // 4. FIX LỖI LOOP JSON & CONTROLLERS
            // ==========================================
            builder.Services.AddControllers().AddJsonOptions(options =>{
                options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
            });

            builder.Services.AddEndpointsApiExplorer();

            // ==========================================
            // 5. CẤU HÌNH SWAGGER 
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

            // CORS đứng đầu để chặn/cho phép ngay từ cửa
            app.UseCors();

            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();

            app.UseStaticFiles();

            // Xác thực & Phân quyền
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}