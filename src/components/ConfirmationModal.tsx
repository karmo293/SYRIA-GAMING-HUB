import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, AlertTriangle, Check, XCircle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'info' | 'danger';
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'نعم، أوافق',
  cancelText = 'إلغاء',
  type = 'info'
}) => {
  const getColor = () => {
    switch (type) {
      case 'warning': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'danger': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'warning': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'danger': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-cyan-500 hover:bg-cyan-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#0a0a0a] border border-white/10 p-8 rounded-[2rem] max-w-sm w-full shadow-2xl overflow-hidden text-right"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border ${getColor()}`}>
              {type === 'warning' || type === 'danger' ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <Check className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-xl font-black uppercase italic mb-2">{title}</h3>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">{message}</p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 ${getButtonColor()} text-black py-3 rounded-xl font-bold transition-all`}
              >
                {confirmText}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl font-bold transition-all border border-white/10"
              >
                {cancelText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmationModal;
