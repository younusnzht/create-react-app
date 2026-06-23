import React from 'react';
import { Lock } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

export default function ModuleGuard({ path, children }) {
  const { getEnabledModules, subscription, currentUser, isCompanyAdmin } = useApp();
  const enabled = getEnabledModules();

  // null means platform_admin → all modules allowed
  if (enabled && !enabled.includes(path)) {
    return <Locked subscription={subscription} reason="plan" />;
  }

  // Staff (non-admin) users are further restricted by their own allowedModules list
  if (!isCompanyAdmin && currentUser?.allowedModules && !currentUser.allowedModules.includes(path)) {
    return <Locked subscription={subscription} reason="access" />;
  }

  return children;
}

function Locked({ subscription, reason }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', minHeight: '60vh', gap: 20, textAlign: 'center', padding: 40,
    }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: 48, maxWidth: 480 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid #F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <Lock size={28} color="#F59E0B" />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
          {reason === 'access' ? 'Access Restricted' : 'Module Locked'}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
          {reason === 'access'
            ? 'Your account does not have access to this module. Contact your company administrator.'
            : <>This module is not included in your current plan or business type.<br />Contact your administrator or upgrade to unlock it.</>
          }
        </p>
        {reason === 'plan' && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 16px', fontSize: 13, color: '#F59E0B', marginBottom: 24 }}>
            Business type: <strong>{subscription?.businessType?.replace(/_/g, ' ') || 'Unknown'}</strong>
          </div>
        )}
        <a href="/settings" style={{ display: 'inline-block', padding: '10px 24px', background: 'var(--primary)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
          Go to Settings
        </a>
      </div>
    </div>
  );
}
