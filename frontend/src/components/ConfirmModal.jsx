import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

const icons = {
  danger: <AlertTriangle size={24} className="text-red-500" />,
  success: <CheckCircle size={24} className="text-emerald-500" />,
  info: <Info size={24} className="text-blue-500" />,
};

const confirmColors = {
  danger: 'bg-red-600 hover:bg-red-700',
  success: 'bg-emerald-600 hover:bg-emerald-700',
  info: 'bg-blue-600 hover:bg-blue-700',
};

export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message = '',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 animate-scale-in">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 mt-0.5">{icons[variant]}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
              {message && <p className="text-sm text-gray-500 mt-1">{message}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition disabled:opacity-50 ${confirmColors[variant]}`}
            >
              {loading ? 'Please wait...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
