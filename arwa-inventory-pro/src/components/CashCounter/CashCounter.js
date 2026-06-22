import React, { useState, useMemo } from 'react';
import { Landmark, Plus, X, Printer, CheckCircle, ArrowDown, ArrowUp } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const getCurrencySymbol = (code) => {
  const symbols = {
    USD: '$', GBP: '£', EUR: '€', CAD: 'CA$', AUD: 'A$', JPY: '¥',
    INR: '₹', PKR: '₨', AED: 'د.إ', SAR: '﷼', CNY: '¥', KRW: '₩',
    BRL: 'R$', MXN: '$', ZAR: 'R', CHF: 'Fr', SEK: 'kr', NOK: 'kr',
    DKK: 'kr', SGD: 'S$', HKD: 'HK$', NZD: 'NZ$', THB: '฿', TRY: '₺',
    RUB: '₽', NGN: '₦', GHS: '₵', KES: 'KSh', EGP: 'E£', MAD: 'MAD',
    QAR: 'QR', OMR: 'OMR', KWD: 'KD', BHD: 'BD', JOD: 'JD',
  };
  return symbols[code] || (code + ' ');
};

function fmt(sym, amount) {
  return `${sym}${Number(amount || 0).toFixed(2)}`;
}

function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString();
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString();
}

// ─── Z-Read Modal ─────────────────────────────────────────────────────────────

function ZReadModal({ session, cashSales, sym, onClose, onConfirmClose }) {
  const [countedCash, setCountedCash] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const movementsIn = (session.cashMovements || [])
    .filter(m => m.type === 'in')
    .reduce((s, m) => s + Number(m.amount || 0), 0);

  const movementsOut = (session.cashMovements || [])
    .filter(m => m.type === 'out')
    .reduce((s, m) => s + Number(m.amount || 0), 0);

  const expectedCash = Number(session.openingFloat || 0) + cashSales + movementsIn - movementsOut;
  const counted = parseFloat(countedCash) || 0;
  const overShort = counted - expectedCash;
  const hasCountedValue = countedCash !== '';
  const pinMatches = session.cashierPin ? confirmPin === session.cashierPin : true;
  const showPinError = session.cashierPin && confirmPin.length === 4 && !pinMatches;

  const handlePrint = () => {
    const w = window.open('', '_blank', 'width=400,height=600');
    w.document.write(`
      <html>
        <head><title>Z-Read Report</title><style>
          body { font-family: monospace; padding: 20px; font-size: 13px; }
          h2 { text-align: center; }
          .row { display: flex; justify-content: space-between; margin: 6px 0; }
          .divider { border-top: 1px dashed #999; margin: 8px 0; }
          .total { font-weight: bold; font-size: 15px; }
          .over { color: green; } .short { color: red; }
        </style></head>
        <body>
          <h2>Z-READ REPORT</h2>
          <div class="row"><span>Session ID:</span><span>${session.id}</span></div>
          <div class="row"><span>Opened At:</span><span>${formatDateTime(session.openedAt)}</span></div>
          <div class="row"><span>Cashier:</span><span>${session.openedBy}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Opening Float:</span><span>${sym}${Number(session.openingFloat).toFixed(2)}</span></div>
          <div class="row"><span>Cash Sales:</span><span>${sym}${cashSales.toFixed(2)}</span></div>
          <div class="row"><span>Movements In:</span><span>${sym}${movementsIn.toFixed(2)}</span></div>
          <div class="row"><span>Movements Out:</span><span>-${sym}${movementsOut.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row total"><span>Expected in Drawer:</span><span>${sym}${expectedCash.toFixed(2)}</span></div>
          <div class="row total"><span>Counted Cash:</span><span>${sym}${counted.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row total ${overShort >= 0 ? 'over' : 'short'}">
            <span>Over/Short:</span><span>${overShort >= 0 ? '+' : ''}${sym}${overShort.toFixed(2)}</span>
          </div>
          <div class="divider"></div>
          <p style="text-align:center;font-size:11px;">Printed: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    w.document.close();
    w.print();
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  };

  const modalStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 28, width: 460, maxWidth: '95vw',
    boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
  };

  const rowStyle = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 0', borderBottom: '1px solid var(--border)',
    color: 'var(--text-primary)', fontSize: 14,
  };

  const labelStyle = { color: 'var(--text-secondary)', fontSize: 13 };

  return (
    <div style={overlayStyle} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={modalStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: 18 }}>Z-Read / Close Till</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <X size={20} />
          </button>
        </div>

        {session.cashierPin && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>
              Confirm PIN to close till
            </label>
            <input
              type="password"
              maxLength={4}
              pattern="[0-9]*"
              inputMode="numeric"
              placeholder="Enter 4-digit PIN"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
                border: `1px solid ${showPinError ? '#EF4444' : 'var(--border)'}`,
                background: 'var(--bg-secondary)',
                color: 'var(--text-primary)', fontSize: 16, fontWeight: 600,
                letterSpacing: '0.3em',
              }}
            />
            {showPinError && (
              <div style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>Incorrect PIN</div>
            )}
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <div style={rowStyle}>
            <span style={labelStyle}>Opening Float</span>
            <span>{fmt(sym, session.openingFloat)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Cash Sales</span>
            <span>{fmt(sym, cashSales)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Total Cash Movements In</span>
            <span style={{ color: '#10B981' }}>+{fmt(sym, movementsIn)}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>Total Cash Movements Out</span>
            <span style={{ color: '#EF4444' }}>-{fmt(sym, movementsOut)}</span>
          </div>
          <div style={{ ...rowStyle, borderBottom: 'none', fontWeight: 700, fontSize: 15, paddingTop: 12 }}>
            <span>Expected Cash in Drawer</span>
            <span>{fmt(sym, expectedCash)}</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: 13, marginBottom: 6 }}>
            Counted Cash (physical count)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={countedCash}
            onChange={(e) => setCountedCash(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8, boxSizing: 'border-box',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontSize: 16, fontWeight: 600,
            }}
          />
        </div>

        {hasCountedValue && (
          <div style={{
            padding: '12px 16px', borderRadius: 8, marginBottom: 16,
            background: overShort >= 0 ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
            border: `1px solid ${overShort >= 0 ? '#10B981' : '#EF4444'}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Over / Short</span>
            <span style={{ color: overShort >= 0 ? '#10B981' : '#EF4444', fontWeight: 700, fontSize: 18 }}>
              {overShort >= 0 ? '+' : ''}{fmt(sym, overShort)}
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handlePrint}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, cursor: 'pointer',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', fontWeight: 600, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <Printer size={16} /> Print Z-Read
          </button>
          <button
            onClick={() => onConfirmClose(session.id, counted)}
            disabled={!hasCountedValue || !pinMatches}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 8, cursor: (hasCountedValue && pinMatches) ? 'pointer' : 'not-allowed',
              border: 'none', background: (hasCountedValue && pinMatches) ? '#EF4444' : '#9CA3AF',
              color: '#fff', fontWeight: 600, display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}
          >
            <CheckCircle size={16} /> Close Till & Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main CashCounter Component ───────────────────────────────────────────────

export default function CashCounter() {
  const {
    orders,
    currentTillSession,
    tillSessions,
    openTill,
    closeTill,
    addCashMovement,
    currentUser,
    currency,
  } = useApp();

  const sym = getCurrencySymbol(currency || 'USD');

  // Open till form state
  const [openingFloat, setOpeningFloat] = useState('');
  const [cashierPin, setCashierPin] = useState('');

  // Movement form state
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementType, setMovementType] = useState('in');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // Z-Read modal
  const [showZRead, setShowZRead] = useState(false);

  // ─── Calculate sales for current session ───────────────────────────────────
  const sessionSales = useMemo(() => {
    if (!currentTillSession) return { cash: 0, card: 0, other: 0, total: 0 };
    const sessionStart = currentTillSession.openedAt;
    const sessionOrders = orders.filter(o => o.date >= sessionStart);

    let cash = 0, card = 0, other = 0;
    sessionOrders.forEach(o => {
      const pmts = o.payments || [];
      if (pmts.length > 0) {
        pmts.forEach(p => {
          const method = (p.method || p.type || '').toLowerCase();
          const amt = parseFloat(p.amount) || 0;
          if (method === 'cash') cash += amt;
          else if (method === 'card') card += amt;
          else other += amt;
        });
      } else {
        // Fallback: single payment field
        const method = (o.payment || '').toLowerCase();
        const amt = parseFloat(o.total) || 0;
        if (method === 'cash') cash += amt;
        else if (method === 'card') card += amt;
        else other += amt;
      }
    });
    return { cash, card, other, total: cash + card + other };
  }, [orders, currentTillSession]);

  // ─── Last 10 closed sessions ────────────────────────────────────────────────
  const closedSessions = useMemo(
    () => tillSessions.filter(s => s.status === 'closed').slice(0, 10),
    [tillSessions]
  );

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleOpenTill = () => {
    const float = parseFloat(openingFloat);
    if (isNaN(float) || float < 0) return;
    if (cashierPin.length !== 4) return;
    openTill(float, currentUser?.name || 'Cashier', cashierPin);
    setOpeningFloat('');
    setCashierPin('');
  };

  const handleAddMovement = () => {
    const amount = parseFloat(movementAmount);
    if (!currentTillSession || isNaN(amount) || amount <= 0 || !movementReason.trim()) return;
    addCashMovement(currentTillSession.id, {
      type: movementType,
      amount,
      reason: movementReason.trim(),
    });
    setMovementAmount('');
    setMovementReason('');
    setShowMovementForm(false);
  };

  const handleCloseTill = (sessionId, countedCash) => {
    closeTill(sessionId, countedCash);
    setShowZRead(false);
  };

  // ─── Session over/short helper ──────────────────────────────────────────────
  const getSessionOverShort = (session) => {
    if (session.closingFloat === null || session.closingFloat === undefined) return null;
    const movIn = (session.cashMovements || []).filter(m => m.type === 'in').reduce((s, m) => s + Number(m.amount || 0), 0);
    const movOut = (session.cashMovements || []).filter(m => m.type === 'out').reduce((s, m) => s + Number(m.amount || 0), 0);
    // We don't store cash sales per session so just show closing vs opening + movements
    // expected = opening + movIn - movOut (approximate without stored cash sales)
    const expected = Number(session.openingFloat || 0) + movIn - movOut;
    return session.closingFloat - expected;
  };

  // ─── Styles ─────────────────────────────────────────────────────────────────
  const pageStyle = {
    padding: 24, maxWidth: 960, margin: '0 auto',
    color: 'var(--text-primary)',
  };

  const cardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 24, marginBottom: 20,
  };

  const statCardStyle = {
    background: 'var(--bg-card)', border: '1px solid var(--border)',
    borderRadius: 12, padding: 20, flex: 1,
  };

  const btnPrimary = {
    background: 'var(--primary)', color: '#fff', border: 'none',
    borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
    fontWeight: 600, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6,
  };

  const btnSecondary = {
    background: 'var(--bg-secondary)', color: 'var(--text-primary)',
    border: '1px solid var(--border)', borderRadius: 8,
    padding: '8px 16px', cursor: 'pointer', fontWeight: 600, fontSize: 13,
    display: 'inline-flex', alignItems: 'center', gap: 6,
  };

  const inputStyle = {
    padding: '10px 12px', borderRadius: 8,
    border: '1px solid var(--border)', background: 'var(--bg-secondary)',
    color: 'var(--text-primary)', fontSize: 14, width: '100%', boxSizing: 'border-box',
  };

  const thStyle = {
    padding: '10px 14px', textAlign: 'left', fontSize: 12,
    color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase',
    letterSpacing: '0.05em', borderBottom: '1px solid var(--border)',
  };

  const tdStyle = {
    padding: '12px 14px', fontSize: 13,
    color: 'var(--text-primary)', borderBottom: '1px solid var(--border)',
  };

  // ─── Render: Active Session ──────────────────────────────────────────────────
  if (currentTillSession) {
    const session = currentTillSession;
    return (
      <div style={pageStyle}>
        {showZRead && (
          <ZReadModal
            session={session}
            cashSales={sessionSales.cash}
            sym={sym}
            onClose={() => setShowZRead(false)}
            onConfirmClose={handleCloseTill}
          />
        )}

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Landmark size={24} style={{ color: 'var(--primary)' }} />
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Cash Counter</h1>
          </div>
          <button
            onClick={() => setShowZRead(true)}
            style={{ ...btnPrimary, background: '#EF4444' }}
          >
            Close Till / Z-Read
          </button>
        </div>

        {/* Session info bar */}
        <div style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: 24, flexWrap: 'wrap', padding: '16px 24px' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Till Opened</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDateTime(session.openedAt)} by {session.openedBy}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Opening Float</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{fmt(sym, session.openingFloat)}</div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span style={{
              background: 'rgba(16,185,129,0.15)', color: '#10B981',
              padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700,
              border: '1px solid rgba(16,185,129,0.3)',
            }}>
              OPEN
            </span>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
          {[
            { label: 'Cash Sales', value: sessionSales.cash, color: '#10B981' },
            { label: 'Card Sales', value: sessionSales.card, color: '#3B82F6' },
            { label: 'Other Sales', value: sessionSales.other, color: '#8B5CF6' },
            { label: 'Total Sales', value: sessionSales.total, color: 'var(--primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ ...statCardStyle, minWidth: 180 }}>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>{label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{fmt(sym, value)}</div>
            </div>
          ))}
        </div>

        {/* Cash Movements */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Cash Movements</h3>
            <button onClick={() => setShowMovementForm(!showMovementForm)} style={btnSecondary}>
              <Plus size={14} /> Add Movement
            </button>
          </div>

          {showMovementForm && (
            <div style={{
              background: 'var(--bg-secondary)', border: '1px solid var(--border)',
              borderRadius: 10, padding: 16, marginBottom: 16,
              display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end',
            }}>
              <div style={{ minWidth: 120 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Type</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value)}
                  style={inputStyle}
                >
                  <option value="in">Cash In</option>
                  <option value="out">Cash Out</option>
                </select>
              </div>
              <div style={{ minWidth: 140 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Amount</label>
                <input
                  type="number" min="0" step="0.01" placeholder="0.00"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>Reason</label>
                <input
                  type="text" placeholder="e.g. Petty cash, float top-up..."
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddMovement} style={btnPrimary}>Save</button>
                <button onClick={() => setShowMovementForm(false)} style={btnSecondary}><X size={14} /></button>
              </div>
            </div>
          )}

          {(session.cashMovements || []).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
              No cash movements recorded yet.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Time</th>
                  <th style={thStyle}>Type</th>
                  <th style={thStyle}>Amount</th>
                  <th style={thStyle}>Reason</th>
                </tr>
              </thead>
              <tbody>
                {(session.cashMovements || []).map((m, i) => (
                  <tr key={i}>
                    <td style={tdStyle}>{formatDateTime(m.at)}</td>
                    <td style={tdStyle}>
                      {m.type === 'in' ? (
                        <span style={{ color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ArrowDown size={13} /> Cash In
                        </span>
                      ) : (
                        <span style={{ color: '#EF4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ArrowUp size={13} /> Cash Out
                        </span>
                      )}
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: m.type === 'in' ? '#10B981' : '#EF4444' }}>
                      {m.type === 'in' ? '+' : '-'}{fmt(sym, m.amount)}
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--text-secondary)' }}>{m.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ─── Render: No Active Session ───────────────────────────────────────────────
  return (
    <div style={pageStyle}>
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
        <Landmark size={24} style={{ color: 'var(--primary)' }} />
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Cash Counter</h1>
      </div>

      {/* Open Till panel */}
      <div style={{ ...cardStyle, maxWidth: 440, marginLeft: 'auto', marginRight: 'auto' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 700, textAlign: 'center' }}>Open Till</h2>
        <p style={{ margin: '0 0 20px', color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
          Enter the opening float amount to begin a new till session.
        </p>
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Opening Float ({sym})
        </label>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 200.00"
          value={openingFloat}
          onChange={(e) => setOpeningFloat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenTill()}
          style={{ ...inputStyle, marginBottom: 16, fontSize: 18, fontWeight: 600, padding: '12px 14px' }}
        />
        <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
          Cashier PIN (4 digits)
        </label>
        <input
          type="password"
          maxLength={4}
          pattern="[0-9]*"
          inputMode="numeric"
          placeholder="••••"
          value={cashierPin}
          onChange={(e) => setCashierPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
          onKeyDown={(e) => e.key === 'Enter' && handleOpenTill()}
          style={{ ...inputStyle, marginBottom: 16, fontSize: 18, fontWeight: 600, padding: '12px 14px', letterSpacing: '0.3em' }}
        />
        <button
          onClick={handleOpenTill}
          disabled={!openingFloat || parseFloat(openingFloat) < 0 || cashierPin.length !== 4}
          style={{
            ...btnPrimary,
            width: '100%', justifyContent: 'center', padding: '13px 0', fontSize: 16,
            opacity: (!openingFloat || parseFloat(openingFloat) < 0 || cashierPin.length !== 4) ? 0.5 : 1,
            cursor: (!openingFloat || parseFloat(openingFloat) < 0 || cashierPin.length !== 4) ? 'not-allowed' : 'pointer',
          }}
        >
          <Landmark size={18} /> Open Till
        </button>
      </div>

      {/* Recent Sessions */}
      <div style={cardStyle}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>Recent Sessions</h3>
        {closedSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-secondary)', fontSize: 13 }}>
            No previous sessions found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Cashier</th>
                  <th style={thStyle}>Opening Float</th>
                  <th style={thStyle}>Counted Cash</th>
                  <th style={thStyle}>Over / Short</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {closedSessions.map((session) => {
                  const overShort = getSessionOverShort(session);
                  return (
                    <tr key={session.id}>
                      <td style={tdStyle}>{formatDate(session.openedAt)}</td>
                      <td style={tdStyle}>{session.openedBy}</td>
                      <td style={tdStyle}>{fmt(sym, session.openingFloat)}</td>
                      <td style={tdStyle}>{session.closingFloat !== null && session.closingFloat !== undefined ? fmt(sym, session.closingFloat) : '—'}</td>
                      <td style={tdStyle}>
                        {overShort !== null ? (
                          <span style={{ color: overShort >= 0 ? '#10B981' : '#EF4444', fontWeight: 600 }}>
                            {overShort >= 0 ? '+' : ''}{fmt(sym, overShort)}
                          </span>
                        ) : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          background: 'rgba(107,114,128,0.15)', color: '#9CA3AF',
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          border: '1px solid rgba(107,114,128,0.3)',
                        }}>
                          CLOSED
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
