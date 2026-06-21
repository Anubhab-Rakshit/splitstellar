import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { setToastCallback } from '../services/toast';

export default function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastCallback((message, type, duration) => {
      const id = Date.now() + Math.random();
      setToasts(prev => [...prev, { id, message, type }]);

      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    });
    return () => setToastCallback(null);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      <AnimatePresence>
        {toasts.map(toast => {
          let Icon = AlertCircle;
          let colorClass = 'text-accent-blue border-[rgba(59,130,246,0.2)] bg-[rgba(59,130,246,0.1)]';
          
          if (toast.type === 'success') {
            Icon = CheckCircle;
            colorClass = 'text-accent-emerald border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.1)]';
          } else if (toast.type === 'error') {
            Icon = AlertCircle;
            colorClass = 'text-accent-danger border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.1)]';
          } else if (toast.type === 'loading') {
            Icon = Loader2;
            colorClass = 'text-accent-amber border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.1)]';
          }

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`flex items-start gap-3 p-4 rounded-xl border backdrop-blur-md shadow-2xl min-w-[300px] max-w-[400px] ${colorClass}`}
            >
              <div className="mt-0.5">
                <Icon className={`w-5 h-5 ${toast.type === 'loading' ? 'animate-spin' : ''}`} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-white">{toast.message}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-text-secondary hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
