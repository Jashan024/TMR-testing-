import React, { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    // Body scroll lock
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = originalStyle;
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex justify-center items-center p-4 backdrop-blur-sm transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg relative border border-zinc-200 animate-fade-in-up max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-zinc-100 flex-shrink-0">
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-50 flex items-center justify-center text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all active:scale-95 border border-zinc-100"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;