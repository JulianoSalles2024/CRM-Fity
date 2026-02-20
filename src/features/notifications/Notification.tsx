
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Info, X, AlertCircle } from 'lucide-react';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-600 border-emerald-500',
  error: 'bg-red-600 border-red-500',
  warning: 'bg-amber-500 border-amber-400',
  info: 'bg-blue-600 border-blue-500',
};

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const Icon = icons[type];
  const colorClass = colors[type];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000); // 5 seconds to auto-close

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`fixed bottom-5 right-5 z-[100] w-full max-w-md rounded-lg shadow-lg text-white p-4 border-l-4 ${colorClass} flex items-center shadow-black/30`}
    >
      <div className="flex items-start w-full">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 text-white" aria-hidden="true" />
        </div>
        <div className="ml-3 w-0 flex-1 pt-0.5">
          <p className="text-sm font-medium leading-5">{message}</p>
        </div>
        <div className="ml-4 flex flex-shrink-0">
          <button
            onClick={onClose}
            className="inline-flex rounded-md bg-transparent text-white/80 hover:text-white focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default Notification;
