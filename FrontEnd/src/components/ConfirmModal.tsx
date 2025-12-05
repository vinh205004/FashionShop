import React from 'react';

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmClassName?: string;
  isLoading?: boolean;
};

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title = 'Xác nhận',
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
  confirmClassName = '',
  isLoading = false,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="bg-white rounded-lg shadow-lg z-50 max-w-md w-full p-6 mx-4">
        <h3 className="text-lg font-semibold mb-3">{title}</h3>
        <div className="text-sm text-gray-700 mb-6">{message}</div>
        <div className="flex justify-end gap-3">
          <button onClick={onCancel} disabled={isLoading} className="px-4 py-2 rounded border">{cancelLabel}</button>
          <button onClick={onConfirm} disabled={isLoading} className={`px-4 py-2 rounded bg-red-600 text-white ${confirmClassName}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
