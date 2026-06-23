import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const ICONS = {
  success: <CheckCircle size={15} />,
  info:    <Info size={15} />,
  warning: <AlertTriangle size={15} />,
  error:   <AlertTriangle size={15} />,
};

const COLORS = {
  success: { bg: '#065F46', border: '#10B981' },
  info:    { bg: '#1E3A5F', border: '#3B82F6' },
  warning: { bg: '#78350F', border: '#F59E0B' },
  error:   { bg: '#7F1D1D', border: '#EF4444' },
};

export default function Toast() {
  const { toast } = useApp();
  const [queue, setQueue] = useState([]);

  const dismiss = useCallback((id) => {
    setQueue(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const item = { ...toast };
    setQueue(prev => [...prev.slice(-4), item]);
    // Each toast manages its own independent timer — do NOT return a cleanup
    // so that switching to a new toast doesn't cancel the previous one's timer.
    setTimeout(() => setQueue(prev => prev.filter(t => t.id !== item.id)), 4000);
  }, [toast]); // eslint-disable-line react-hooks/exhaustive-deps

  if (queue.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end',
    }}>
      {queue.map(t => {
        const type = t.type || 'success';
        const colors = COLORS[type] || COLORS.success;
        return (
          <div
            key={t.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px', borderRadius: 10,
              background: colors.bg,
              border: `1px solid ${colors.border}`,
              color: 'white', fontSize: 13, fontWeight: 500,
              maxWidth: 360, minWidth: 220,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
              animation: 'slideInRight 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}
          >
            <span style={{ flexShrink: 0, opacity: 0.9 }}>{ICONS[type]}</span>
            <span style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'rgba(255,255,255,0.6)', padding: 2, display: 'flex',
                flexShrink: 0, borderRadius: 4,
              }}
              aria-label="Dismiss"
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
