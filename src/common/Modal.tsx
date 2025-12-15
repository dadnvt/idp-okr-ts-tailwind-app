import React from 'react';
import { FaTimes } from 'react-icons/fa';
import { Button } from '../components/Button';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, children, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl p-6 animate-fadeIn relative">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-3 mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close modal"
          >
            <FaTimes size={18} />
          </Button>
        </div>

        {/* Nội dung */}
        <div className="overflow-y-auto max-h-[65vh] space-y-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
