import { useState, useEffect } from 'react';
import type { Voucher, VoucherValidation } from '../services/voucherService';
import { getVouchers, validateVoucher } from '../services/voucherService';
import { useToast } from '../contexts/ToastContext';

interface VoucherSectionProps {
  totalAmount: number;
  onApplyVoucher: (code: string, discount: number) => void;
  appliedVoucher?: string | null;
}

export default function VoucherSection({
  totalAmount,
  onApplyVoucher,
  appliedVoucher,
}: VoucherSectionProps) {
  const { addToast } = useToast();
  const [voucherCode, setVoucherCode] = useState('');
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [showVouchers, setShowVouchers] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    const loadVouchers = async () => {
      try {
        setLoading(true);
        const data = await getVouchers(); // Gọi API thật
        setVouchers(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadVouchers();
  }, [addToast]);

  const handleValidateVoucher = async () => {
    if (!voucherCode.trim()) {
      addToast('Vui lòng nhập mã voucher', 'error');
      return;
    }

    setValidating(true);
    try {
      const result: VoucherValidation = await validateVoucher(voucherCode, totalAmount);

      if (result.isValid && result.discount) {
        onApplyVoucher(voucherCode, result.discount);
        addToast(result.message, 'success');
        setVoucherCode('');
        setShowVouchers(false);
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Error validating voucher:', error);
      addToast('Có lỗi xảy ra', 'error');
    } finally {
      setValidating(false);
    }
  };

  const handleQuickApply = async (voucher: Voucher) => {
    setValidating(true);
    try {
      const result: VoucherValidation = await validateVoucher(voucher.code, totalAmount);

      if (result.isValid && result.discount) {
        onApplyVoucher(voucher.code, result.discount);
        addToast(result.message, 'success');
        setVoucherCode('');
        setShowVouchers(false);
      } else {
        addToast(result.message, 'error');
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      addToast('Có lỗi xảy ra', 'error');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="font-semibold mb-3">Mã Voucher/Khuyến Mãi</h3>

      {appliedVoucher && (
        <div className="bg-green-50 border border-green-200 p-3 rounded mb-3 flex justify-between items-center">
          <span className="text-green-700">✓ Đã áp dụng: <strong>{appliedVoucher}</strong></span>
          <button
            onClick={() => onApplyVoucher('', 0)}
            className="text-green-600 hover:text-green-800 text-sm"
          >
            Bỏ
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <input
          type="text"
          placeholder="Nhập mã voucher"
          value={voucherCode}
          onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleValidateVoucher();
            }
          }}
          disabled={validating || appliedVoucher !== null}
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        />
        <button
          onClick={handleValidateVoucher}
          disabled={validating || appliedVoucher !== null || !voucherCode}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {validating ? 'Đang kiểm tra...' : 'Áp dụng'}
        </button>
      </div>

      {/* Nút xem voucher có sẵn */}
      <button
        onClick={() => setShowVouchers(!showVouchers)}
        className="text-blue-600 hover:text-blue-800 text-sm underline mb-3"
      >
        {showVouchers ? 'Ẩn' : 'Xem'} voucher khả dụng ({vouchers.length})
      </button>

      {/* Danh sách voucher */}
      {showVouchers && (
        <div className="border-t pt-3">
          {loading ? (
            <div className="text-center py-4 text-gray-500">Đang tải voucher...</div>
          ) : vouchers.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Không có voucher nào</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {vouchers.map((voucher) => {
                const canApply =
                  (!voucher.minAmount || totalAmount >= voucher.minAmount) &&
                  (!voucher.usageLimit || (voucher.usageCount || 0) < voucher.usageLimit);

                return (
                  <div
                    key={voucher.id}
                    className={`p-3 border rounded-lg ${
                      canApply ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <div className="font-semibold text-sm">{voucher.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{voucher.description}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Hạn dùng: {new Date(voucher.expiredAt).toLocaleDateString('vi-VN')}
                        </div>
                        {voucher.minAmount && (
                          <div className="text-xs text-gray-500">
                            Đơn tối thiểu: {voucher.minAmount.toLocaleString('vi-VN')} ₫
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleQuickApply(voucher)}
                        disabled={!canApply || validating}
                        className={`px-3 py-2 rounded text-sm font-semibold whitespace-nowrap ${
                          canApply
                            ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {validating ? 'Đang áp dụng...' : 'Dùng'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Thông báo điều kiện áp dụng */}
      <div className="text-xs text-gray-500 mt-3 italic">
        💡 Chỉ có thể áp dụng 1 voucher cho mỗi đơn hàng
      </div>
    </div>
  );
}
