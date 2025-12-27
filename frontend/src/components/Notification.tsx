import { useState, useEffect } from 'react';

interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  show: boolean;
  onClose: () => void;
  duration?: number;
}

export function Notification({ message, type, show, onClose, duration = 3000 }: NotificationProps) {
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);

  if (!show) return null;

  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-md w-full transform transition-all duration-300 ease-in-out ${
      show ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`p-4 rounded-lg border shadow-lg ${getStyles()}`}>
        <div className="flex items-start">
          <span className="flex-shrink-0 mr-3 text-lg">
            {getIcon()}
          </span>
          <div className="flex-1">
            <p className="font-medium text-sm">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 text-lg hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// Hook to manage notifications
export function useNotification() {
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    show: boolean;
  }>({
    message: '',
    type: 'info',
    show: false
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setNotification({ message, type, show: true });
  };

  const hideNotification = () => {
    setNotification(prev => ({ ...prev, show: false }));
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
}