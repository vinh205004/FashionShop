import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import SizePicker from '../../components/SizePicker';
import VoucherSection from '../../components/VoucherSection';
import { checkVoucherAPI } from '../../services/voucherService';


export default function Cart() {
  const { items, updateQty, removeItem, updateSize, clear } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string | number; title: string; size?: string } | null>(null);
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [sizeTargetId, setSizeTargetId] = useState<number | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  // chọn các mục trong giỏ hàng để thanh toán
  const [selectedIds, setSelectedIds] = useState<Array<number>>(() => items.map(i => i.id));

  // hiển thị voucher đã áp dụng từ localStorage khi component mount
  useEffect(() => {
    try {
      const savedVoucher = localStorage.getItem('appliedVoucher');
      const savedDiscount = localStorage.getItem('voucherDiscount');
      if (savedVoucher && savedDiscount) {
        setAppliedVoucher(savedVoucher);
        setVoucherDiscount(parseInt(savedDiscount, 10));
      }
    } catch (err) { console.debug(err); }
  }, []);

  useEffect(() => {
    setSelectedIds(prev => {
      const ids = items.map(i => i.id);
      const filtered = prev.filter(id => ids.includes(id));
      return filtered.length > 0 ? filtered : ids;
    });
  }, [items]);

  const selectedSubtotal = items
    .filter(it => selectedIds.includes(it.id))
    .reduce((s, it) => s + it.price * it.quantity, 0);

  const subtotal = selectedSubtotal;
  const total = Math.max(0, subtotal - voucherDiscount);

  useEffect(() => {
    try {
      localStorage.setItem('selectedCartIds', JSON.stringify(selectedIds));
    } catch (err) { console.debug(err); }
  }, [selectedIds]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('selectedCartIds');
      if (raw) {
        const parsed = JSON.parse(raw) as number[];
        const ids = items.map(i => i.id);
        const filtered = parsed.filter(id => ids.includes(id));
        if (filtered.length > 0) setSelectedIds(filtered);
      }
    } catch (err) { console.debug(err); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const revalidateVoucher = async () => {
      // 1. Nếu giỏ hàng rỗng hoặc không có voucher -> Reset về 0 ngay lập tức
      if (items.length === 0 || !appliedVoucher) {
        if (voucherDiscount > 0) {
          setVoucherDiscount(0);
          setAppliedVoucher(null);
          localStorage.removeItem('appliedVoucher');
          localStorage.removeItem('voucherDiscount');
        }
        return;
      }

      // 2. Nếu có voucher, gọi API kiểm tra lại với tổng tiền MỚI (selectedSubtotal)
      try {
        const result = await checkVoucherAPI(appliedVoucher, selectedSubtotal);
        if (result) {
          // Cập nhật lại số tiền giảm mới
          setVoucherDiscount(result.discountAmount);
          localStorage.setItem('voucherDiscount', result.discountAmount.toString());
        }
      } catch (error) {
        // 3. Nếu voucher không còn hợp lệ
        // -> Tự động gỡ voucher ra
        console.warn("Voucher không còn hợp lệ do thay đổi giỏ hàng:", error);
        
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        localStorage.removeItem('appliedVoucher');
        localStorage.removeItem('voucherDiscount');
        addToast('Voucher đã bị gỡ do đơn hàng thay đổi', 'info');
      }
    };

    // Debounce nhẹ để không gọi API liên tục khi click nhanh
    const timeoutId = setTimeout(() => {
      revalidateVoucher();
    }, 500);

    return () => clearTimeout(timeoutId);

  }, [addToast, selectedSubtotal, appliedVoucher, items.length, voucherDiscount]);
  return (
    <>
    <div className="max-w-6xl mx-auto my-10 px-6">
      <h1 className="text-2xl font-bold mb-6">Giỏ hàng của bạn</h1>

      {items.length === 0 ? (
        <div className="bg-white p-8 rounded shadow text-center">
          <p className="mb-4">Giỏ hàng của bạn đang trống.</p>
          <Link to="/" className="text-sm px-4 py-2 bg-[#374151] text-white rounded">Tiếp tục mua sắm</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 rounded shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(items.map(i => i.id));
                    else setSelectedIds([]);
                  }}
                  className="w-4 h-4"
                />
                <span className="font-semibold">Chọn tất cả</span>
              </div>
              <button
                onClick={() => navigate('/orders')}
                className="text-sm text-blue-600 underline"
              >
                Lịch sử đơn hàng
              </button>
            </div>

            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-4 py-4 border-b">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(it.id)}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, it.id])));
                    else setSelectedIds(prev => prev.filter(id => id !== it.id));
                  }}
                  className="w-4 h-4"
                />
                <img src={it.images[0]} className="w-24 h-24 object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">{it.title}</div>
                  <div className="text-sm text-gray-600">{it.badges?.join(', ')}</div>
                  {it.sizes && it.sizes.length > 0 && (
                    <div className="mt-2">
                      <button
                        onClick={() => {
                          setSizeTargetId(it.id);
                          setSizePickerOpen(true);
                        }}
                        className="text-sm text-gray-800 underline"
                      >
                        {it.selectedSize ? `Kích cỡ: ${it.selectedSize}` : 'Chọn kích cỡ'}
                      </button>
                    </div>
                  )}
                </div>
                <div className="w-40 text-right">
                  <div className="font-bold">{it.price.toLocaleString('vi-VN')} ₫</div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button onClick={() => updateQty(it.id, it.selectedSize || "", it.quantity - 1)} 
                      className="px-2 py-1 border rounded">-</button>
                    <div className="px-3 py-1 border rounded">{it.quantity}</div>
                    <button onClick={() => updateQty(it.id, it.selectedSize || "", it.quantity + 1)} 
                      className="px-2 py-1 border rounded">+</button>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">Tạm tính: {(it.price * it.quantity).toLocaleString('vi-VN')} ₫</div>
                  <div className="mt-2">
                    <button
                      onClick={() => {
                        setTarget({ id: it.id, title: it.title, size: it.selectedSize || "" });
                        setConfirmOpen(true);
                      }}
                      className="text-sm text-red-600"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-1">
            {/* Voucher Section */}
            <VoucherSection
  totalAmount={subtotal}
  appliedVoucher={appliedVoucher}
  onApplyVoucher={async (code) => {
    // TRƯỜNG HỢP 1: Bấm nút Xóa voucher 
    if (!code) {
      setAppliedVoucher(null);
      setVoucherDiscount(0);
      localStorage.removeItem('appliedVoucher');
      localStorage.removeItem('voucherDiscount');
      addToast('Đã bỏ voucher', 'info');
      return;
    }

    // TRƯỜNG HỢP 2: Bấm nút Áp dụng
    try {
      // Gọi API kiểm tra
      const result = await checkVoucherAPI(code, subtotal);
      
      if (result) {
        setAppliedVoucher(result.code);
        setVoucherDiscount(result.discountAmount);
        
        
        localStorage.setItem('appliedVoucher', result.code);
        localStorage.setItem('voucherDiscount', result.discountAmount.toString());
        
        addToast(`${result.message} Giảm ${result.discountAmount.toLocaleString()}đ`, 'success');
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      // Hiện thông báo lỗi từ Backend 
      addToast(err.message, 'error');
      
      // Reset voucher nếu lỗi
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    }
  }}
/>

            {/* Tóm tắt thanh toán */}
            <div className="bg-white p-4 rounded shadow h-min">
              <div className="text-sm text-gray-600 mb-2">Tóm Tắt Đơn Hàng</div>
              <div className="space-y-2 mb-4 pb-4 border-b">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính:</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm ({appliedVoucher}):</span>
                    <span>-{voucherDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Tổng cộng:</span>
                <span className="text-2xl font-bold text-red-600">
                  {total.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <button 
                onClick={() => {
                  if (selectedIds.length === 0) {
                    addToast('Vui lòng chọn ít nhất 1 sản phẩm để thanh toán', 'error');
                    return;
                  }
                  localStorage.setItem('checkoutSelectedIds', JSON.stringify(selectedIds));
                  navigate('/checkout');
                }}
                className="w-full bg-[#274151] text-white py-2 rounded mb-2 hover:bg-[#1a2d3d] transition-colors font-semibold"
              >
                Tiến hành thanh toán
              </button>
              <button
                onClick={() => {
                  setTarget({ id: 'clear', title: 'Toàn bộ giỏ hàng' });
                  setConfirmOpen(true);
                }}
                className="w-full border py-2 rounded text-sm hover:bg-gray-50 transition-colors"
              >
                Xóa giỏ hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
      <ConfirmModal
        open={confirmOpen}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa "${target?.title}" khỏi giỏ hàng không?`}
        onCancel={() => { setConfirmOpen(false); setTarget(null); }}
        onConfirm={() => {
          if (target) {
            if (target.id === 'clear') {
              clear();
              addToast('Đã xóa tất cả sản phẩm khỏi giỏ hàng.', 'success');
            } else {
              removeItem(Number(target.id), target.size || "");
              addToast('Đã xóa sản phẩm khỏi giỏ hàng.', 'success');
            }
          }
          setConfirmOpen(false);
          setTarget(null);
        }}
      />

      <SizePicker
        open={sizePickerOpen}
        item={items.find(x => x.id === sizeTargetId) ?? null}
        selected={items.find(x => x.id === sizeTargetId)?.selectedSize}
        onCancel={() => { setSizePickerOpen(false); setSizeTargetId(null); }}
        onConfirm={(size) => {
          if (size && sizeTargetId !== null) {
            updateSize(sizeTargetId, size);
            addToast(`Đã chọn kích cỡ ${size} cho sản phẩm.`, 'success');
          }
          setSizePickerOpen(false);
          setSizeTargetId(null);
        }}
      />
    </>
  );
}