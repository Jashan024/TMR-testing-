import React, { ReactNode, useEffect } from 'react';
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

    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-brand-dark/80 z-[100] flex justify-center items-center p-4 backdrop-blur-md transition-all duration-300"
      onClick={onClose}
    >
      <div
        className="bg-white/[0.03] backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-lg relative border border-white/[0.1] animate-fade-in-up max-h-[90vh] flex flex-col overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-8 py-6 border-b border-white/[0.05] flex-shrink-0">
          <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-8 overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;