import { type ReactNode } from "react";

interface ModalProps{
      isOpen:boolean;
      onClose: () =>void;
      title:string;
      children:ReactNode;
}

export default function Modal({isOpen, onClose, title, children}:ModalProps) {
      if(!isOpen)return null;

      return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-40" onClick={onClose}></div>

        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="p-6">{children}</div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mr-3"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

