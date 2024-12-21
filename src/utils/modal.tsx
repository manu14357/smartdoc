// ./ui/modal.tsx

import { FC, ReactNode } from 'react'

interface ModalProps {
  onClose: () => void
  children: ReactNode
}

export const Modal: FC<ModalProps> = ({ onClose, children }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6">
        <button
          className="absolute top-4 right-4 text-gray-500"
          onClick={onClose}
        >
          &times;
        </button>
        <div>{children}</div>
      </div>
    </div>
  )
}
