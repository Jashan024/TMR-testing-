import React, { ReactNode, useEffect } from 'react';
import { CloseIcon } from './Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  // Handle escape key
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalPosition = document.body.style.position;
      const originalWidth = document.body.style.width;
      const scrollY = window.scrollY;

      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.top = `-${scrollY}px`;

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.position = originalPosition;
        document.body.style.width = originalWidth;
        document.body.style.top = '';
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 z-50 overflow-y-auto backdrop-blur-sm" 
      onClick={onClose}
    >
      {/* Flex container for centering - uses min-height to allow scrolling on small screens */}
      <div className="min-h-full flex items-start sm:items-center justify-center p-4 py-8 sm:py-4">
        <div 
          className="bg-gray-800/95 rounded-2xl shadow-xl w-full max-w-lg relative border border-gray-700 animate-fade-in-up my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Sticky header so close button is always accessible */}
          <div className="sticky top-0 flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800/95 rounded-t-2xl z-10">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-white transition p-1 -mr-1 rounded-lg hover:bg-gray-700/50"
              aria-label="Close modal"
            >
              <CloseIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;