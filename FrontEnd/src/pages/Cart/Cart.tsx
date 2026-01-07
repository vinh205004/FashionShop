import { useState, useEffect } from 'react';
import { useCart } from '../../contexts/CartContext';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../contexts/ToastContext';
import ConfirmModal from '../../components/ConfirmModal';
import SizePicker from '../../components/SizePicker';
import VoucherSection from '../../components/VoucherSection';
import { checkVoucherAPI } from '../../services/voucherService';

export default function Cart() {
  const { items, updateQty, removeFromCart, updateSize, clear } = useCart();
  const { addToast } = useToast();
  const navigate = useNavigate();
  
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState<{ id: string | number; title: string; size?: string } | null>(null);
  const [sizePickerOpen, setSizePickerOpen] = useState(false);
  const [sizeTargetId, setSizeTargetId] = useState<number | null>(null);
  
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);

  const [selectedIds, setSelectedIds] = useState<Array<number>>(() => items.map(i => i.id));

  // --- Effects (Giữ nguyên logic cũ) ---
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
      if (items.length === 0 || !appliedVoucher) {
        if (voucherDiscount > 0) {
          setVoucherDiscount(0);
          setAppliedVoucher(null);
          localStorage.removeItem('appliedVoucher');
          localStorage.removeItem('voucherDiscount');
        }
        return;
      }

      try {
        const result = await checkVoucherAPI(appliedVoucher, selectedSubtotal);
        if (result) {
          setVoucherDiscount(result.discountAmount);
          localStorage.setItem('voucherDiscount', result.discountAmount.toString());
        }
      } catch (error) {
        console.warn("Voucher reset:", error);
        setAppliedVoucher(null);
        setVoucherDiscount(0);
        localStorage.removeItem('appliedVoucher');
        localStorage.removeItem('voucherDiscount');
        addToast('Voucher đã bị gỡ do đơn hàng thay đổi', 'info');
      }
    };

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
            
            {/* Header Chọn tất cả */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(items.map(i => i.id));
                    else setSelectedIds([]);
                  }}
                  className="w-4 h-4 accent-black"
                />
                <span className="font-semibold">Chọn tất cả ({items.length})</span>
              </div>
              <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 underline">
                Lịch sử đơn hàng
              </button>
            </div>

            {/* Danh sách Items */}
            {items.map((it) => {
               // 👇 [QUAN TRỌNG] Lấy giới hạn tồn kho. 
               // Nếu bạn chưa map, mặc định fallback là 999 để không lỗi code cũ.
               // Bạn cần sửa chỗ AddToCart để thêm field 'stock': { ...product, stock: product.quantity }
               // eslint-disable-next-line @typescript-eslint/no-explicit-any
               const maxStock = (it as any).stock !== undefined ? (it as any).stock : 999;
               const isMaxReached = it.quantity >= maxStock;

               return (
                <div key={it.id} className="flex items-center gap-4 py-4 border-b last:border-0">
                    <input
                    type="checkbox"
                    checked={selectedIds.includes(it.id)}
                    onChange={(e) => {
                        if (e.target.checked) setSelectedIds(prev => Array.from(new Set([...prev, it.id])));
                        else setSelectedIds(prev => prev.filter(id => id !== it.id));
                    }}
                    className="w-4 h-4 accent-black"
                    />
                    
                    <div className="w-24 h-24 flex-shrink-0 border rounded overflow-hidden">
                        <img src={it.images[0]} alt={it.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate pr-4">{it.title}</div>
                        <div className="text-sm text-gray-600">{it.badges?.join(', ')}</div>
                        
                        {/* Chọn Size */}
                        {it.selectedSize && it.selectedSize.length > 0 && (
                            <div className="mt-1">
                            <button
                                onClick={() => {
                                    setSizeTargetId(it.id);
                                    setSizePickerOpen(true);
                                }}
                                className="text-sm text-gray-500 hover:text-black hover:underline flex items-center gap-1"
                            >
                                Phân loại: <span className="font-medium text-gray-800">{it.selectedSize || 'Chọn'}</span> 
                                <span className="text-[10px]">▼</span>
                            </button>
                            </div>
                        )}
                        
                        {/* Cảnh báo nếu số lượng max */}
                        {isMaxReached && (
                            <div className="text-xs text-red-500 mt-1">
                                Đã đạt giới hạn kho ({maxStock})
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="font-bold text-gray-900">{it.price.toLocaleString('vi-VN')} ₫</div>
                        
                        {/* Bộ điều khiển số lượng */}
                        <div className="flex items-center border rounded">
                            <button 
                                onClick={() => updateQty(it.id, it.selectedSize || "", it.quantity - 1)} 
                                className="px-3 py-1 hover:bg-gray-100 transition"
                            >
                                -
                            </button>
                            <div className="px-2 py-1 text-sm font-medium w-8 text-center">{it.quantity}</div>
                            <button 
                                onClick={() => {
                                    // 👇 Logic chặn tăng quá số lượng kho
                                    if (it.quantity >= maxStock) {
                                        addToast(`Kho chỉ còn ${maxStock} sản phẩm!`, 'error');
                                        return;
                                    }
                                    updateQty(it.id, it.selectedSize || "", it.quantity + 1);
                                }} 
                                disabled={isMaxReached}
                                className={`px-3 py-1 transition ${isMaxReached ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                            >
                                +
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setTarget({ id: it.id, title: it.title, size: it.selectedSize || "" });
                                setConfirmOpen(true);
                            }}
                            className="text-xs text-gray-400 hover:text-red-600 transition"
                        >
                            Xóa
                        </button>
                    </div>
                </div>
               );
            })}
          </div>

          <div className="lg:col-span-1">
            {/* Voucher Section */}
            <VoucherSection
                totalAmount={subtotal}
                appliedVoucher={appliedVoucher}
                onApplyVoucher={async (code) => {
                    if (!code) { // Xóa voucher
                        setAppliedVoucher(null);
                        setVoucherDiscount(0);
                        localStorage.removeItem('appliedVoucher');
                        localStorage.removeItem('voucherDiscount');
                        addToast('Đã bỏ voucher', 'info');
                        return;
                    }
                    try {
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
                        addToast(err.message, 'error');
                        setAppliedVoucher(null);
                        setVoucherDiscount(0);
                    }
                }}
            />

            {/* Tóm tắt thanh toán */}
            <div className="bg-white p-6 rounded shadow mt-6">
              <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">Thanh Toán</h3>
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Tạm tính ({selectedIds.length} món):</span>
                  <span>{subtotal.toLocaleString('vi-VN')} ₫</span>
                </div>
                {voucherDiscount > 0 && (
                  <div className="flex justify-between text-green-600 font-medium">
                    <span>Voucher ({appliedVoucher}):</span>
                    <span>-{voucherDiscount.toLocaleString('vi-VN')} ₫</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 border-t mt-4">
                  <span className="text-lg font-bold text-gray-800">Tổng cộng:</span>
                  <span className="text-2xl font-bold text-red-600">
                    {total.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
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
                className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-bold text-lg shadow-lg mb-3"
              >
                MUA HÀNG NGAY
              </button>
              
              <button
                onClick={() => {
                  setTarget({ id: 'clear', title: 'Toàn bộ giỏ hàng' });
                  setConfirmOpen(true);
                }}
                className="w-full py-2 text-sm text-gray-500 hover:text-red-600 hover:underline transition-colors"
              >
                Xóa tất cả giỏ hàng
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
              removeFromCart(Number(target.id), target.size || "");
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