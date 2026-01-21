using CloudinaryDotNet;
using CloudinaryDotNet.Actions;

namespace BackEnd.Services
{
    public interface ICloudinaryService
    {
        Task<string> UploadImageAsync(IFormFile file);
    }

    public class CloudinaryService : ICloudinaryService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration config)
        {
            // Lấy thông tin từ appsettings.json
            var cloudName = config["CloudinarySettings:CloudName"];
            var apiKey = config["CloudinarySettings:ApiKey"];
            var apiSecret = config["CloudinarySettings:ApiSecret"];

            var account = new Account(cloudName, apiKey, apiSecret);
            _cloudinary = new Cloudinary(account);
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;

            // Mở luồng đọc file
            using var stream = file.OpenReadStream();

            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "fashion_shop_products" // Tên thư mục trên Cloud
            };

            // Gọi hàm upload của thư viện
            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            // Trả về link ảnh (SecureUrl là link https)
            return uploadResult.SecureUrl.ToString();
        }
    }
}