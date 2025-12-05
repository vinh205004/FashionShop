using BackEnd.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BackEnd.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly FashionShopDbContext _context;

        public PaymentsController(FashionShopDbContext context)
        {
            _context = context;
        }

        // API 1: TẠO GIAO DỊCH THANH TOÁN
        // POST: api/Payments/create
        [HttpPost("create")]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentRequest request)
        {
            // 1. Kiểm tra đơn hàng có tồn tại không
            var order = await _context.Orders.FindAsync(request.OrderId);
            if (order == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            }

            if (order.PaymentStatus == "Paid")
            {
                return BadRequest(new { message = "Đơn hàng này đã được thanh toán rồi!" });
            }

            // 2. Tạo bản ghi Payment
            var payment = new Payment
            {
                OrderId = request.OrderId,
                PaymentMethod = request.PaymentMethod,
                Amount = request.Amount,
                PaymentDate = DateTime.Now,
                Status = "Pending", // Mặc định là đang chờ
                TransactionId = Guid.NewGuid().ToString() // Mã giao dịch giả
            };

            // Nếu là COD thì coi như xong luôn (nhưng chưa Paid, chỉ là ghi nhận phương thức)
            if (request.PaymentMethod == "COD")
            {
                payment.Status = "Pending";
                payment.Note = "Thanh toán khi nhận hàng";
            }
            else
            {
                //  Online (VNPay/Momo) -> demo đang xử lý
                payment.Note = $"Đang chờ thanh toán qua {request.PaymentMethod}";
            }

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã tạo giao dịch thanh toán",
                paymentId = payment.PaymentId,
                transactionId = payment.TransactionId
            });
        }

        // API 2: XÁC NHẬN THANH TOÁN THÀNH CÔNG (Dùng để giả lập Callback từ Ngân hàng)
        // POST: api/Payments/confirm/5
        [HttpPost("confirm/{paymentId}")]
        public async Task<IActionResult> ConfirmPayment(int paymentId)
        {
            var payment = await _context.Payments.FindAsync(paymentId);
            if (payment == null) return NotFound("Không tìm thấy giao dịch");

            // 1. Cập nhật bảng Payment
            payment.Status = "Success";
            payment.ResponseCode = "00"; // Mã thành công chuẩn VNPay
            payment.PaymentDate = DateTime.Now;

            // 2. Cập nhật bảng Order (Quan trọng nhất)
            var order = await _context.Orders.FindAsync(payment.OrderId);
            if (order != null)
            {
                order.PaymentStatus = "Paid"; 

                order.OrderStatus = "Completed";
            }

            await _context.SaveChangesAsync();

            return Ok(new { message = "Thanh toán thành công! Đơn hàng đã được cập nhật." });
        }
    }
}
