import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const icons = {
  success: <CheckCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <AlertTriangle size={16} />,
};

export default function Toast() {
  const { toast } = useApp();
  const [queue, setQueue] = useState([]);

  useEffect(() => {
    if (toast) {
      setQueue(prev => [...prev.slice(-2), { ...toast, key: toast.id }]);
      const t = setTimeout(() => setQueue(prev => prev.filter(item => item.key !== toast.id)), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  return (
    <div className="toast-container" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {queue.map(t => (
        <div key={t.key} className={`toast toast-${t.type || 'success'}`} style={{ animation: 'slideUp 0.2s ease' }}>
          {icons[t.type || 'success']}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
