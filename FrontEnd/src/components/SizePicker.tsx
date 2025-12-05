import React, { useEffect, useState } from 'react';
import type { CartItem } from '../contexts/CartContext';

type SizePickerProps = {
  open: boolean;
  item?: CartItem | null;
  selected?: string | undefined;
  onCancel: () => void;
  onConfirm: (size?: string) => void;
};

const SizePicker: React.FC<SizePickerProps> = ({ open, item, selected, onCancel, onConfirm }) => {
  const [selectedLocal, setSelectedLocal] = useState<string | undefined>(selected);

  useEffect(() => {
    setSelectedLocal(selected);
  }, [selected, open]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-white rounded-lg shadow-lg z-50 max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-semibold mb-3">Chọn kích cỡ</h3>
        <p className="text-sm text-gray-700 mb-4">{item.title}</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {item.sizes?.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedLocal(s)}
              className={`px-3 py-2 border rounded text-sm ${selectedLocal === s ? 'bg-gray-800 text-white' : 'bg-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} className="px-4 py-2 rounded border">Hủy</button>
          <button
            onClick={() => onConfirm(selectedLocal)}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
};

export default SizePicker;
