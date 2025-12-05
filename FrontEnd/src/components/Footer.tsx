import visa from '../assets/visa.PNG';
import mcard from '../assets/MCard.PNG';
import vnpay from '../assets/vnpay.PNG';
import { FaFacebook, FaInstagram, FaYoutube, FaTiktok } from "react-icons/fa";

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#3c474c] text-gray-200 py-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 px-6">
        {/* Cột 1 */}
        <div>
          <h3 className="font-bold text-white mb-3">CÔNG TY CỔ PHẦN CANIFA</h3>
          <p>Số ĐKKD: 0107574310, ngày cấp: 23/09/2016</p>
          <p>Trụ sở chính: 688 Quang Trung, Hà Đông, Hà Nội</p>
          <p>Email: hello@canifa.com</p>
          <p>© 2025 CANIFA</p>
        </div>

        {/* Cột 2 */}
        <div>
          <h4 className="font-semibold mb-3">THƯƠNG HIỆU</h4>
          <ul className="space-y-1 text-sm">
            <li>Giới thiệu</li>
            <li>Hệ thống cửa hàng</li>
            <li>Tin tức</li>
            <li>Tuyển dụng</li>
            <li>Liên hệ</li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div>
          <h4 className="font-semibold mb-3">HỖ TRỢ</h4>
          <ul className="space-y-1 text-sm">
            <li>Hỏi đáp</li>
            <li>Chính sách KHTT</li>
            <li>Vận chuyển</li>
            <li>Bảo mật thông tin</li>
          </ul>
        </div>

        {/* Cột 4 */}
        <div>
          <h4 className="font-semibold mb-3">THEO DÕI CHÚNG TÔI</h4>
            <div className="flex gap-4 mb-4 text-xl">
                <FaFacebook />
                <FaInstagram />
                <FaYoutube />
                <FaTiktok />
            </div>
          <h4 className="font-semibold mb-3">PHƯƠNG THỨC THANH TOÁN</h4>
          <div className="flex gap-2">
            <img src={visa} alt="Visa" className="w-8" />
            <img src={mcard} alt="Mastercard" className="w-8" />
            <img src={vnpay} alt="VNPAY" className="w-8" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
