import React from 'react';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XCircleIcon } from './icons/XCircleIcon';
import { InformationCircleIcon } from './icons/InformationCircleIcon';

type NotificationType = 'success' | 'error' | 'info';

interface NotificationToastProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const icons = {
  success: <CheckCircleIcon className="w-6 h-6 text-green-500" />,
  error: <XCircleIcon className="w-6 h-6 text-red-500" />,
  info: <InformationCircleIcon className="w-6 h-6 text-blue-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
};

const textColors = {
  success: 'text-green-800',
  error: 'text-red-800',
  info: 'text-blue-800',
};

const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, onClose }) => {
  return (
    <div
      className={`
        w-full max-w-sm rounded-lg shadow-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5
        ${bgColors[type]}
      `}
    >
      <div className="flex-1 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 pt-0.5">
            {icons[type]}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className={`text-sm font-medium ${textColors[type]} break-words`}>
              {message}
            </p>
          </div>
        </div>
      </div>
      <div className="flex border-l border-gray-200/60">
        <button
          onClick={onClose}
          className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-500 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
        >
          Tutup
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;