import React from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const icons = {
  success: <CheckCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertTriangle size={16} />,
  error: <AlertTriangle size={16} />,
};

export default function Toast() {
  const { toast } = useApp();
  if (!toast) return null;

  return (
    <div className="toast-container">
      <div className={`toast toast-${toast.type || 'success'}`}>
        {icons[toast.type || 'success']}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}
