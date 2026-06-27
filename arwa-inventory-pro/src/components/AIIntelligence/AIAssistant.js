import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, TrendingUp, Package, DollarSign, AlertTriangle, BarChart3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';

const QUICK_PROMPTS = [
  { label: 'Sales summary this month', icon: TrendingUp },
  { label: 'Which products are low on stock?', icon: Package },
  { label: 'What is my total revenue today?', icon: DollarSign },
  { label: 'Show me top 5 selling products', icon: BarChart3 },
  { label: 'Any expiring products this week?', icon: AlertTriangle },
];

function generateAIResponse(query, products, orders, customers) {
  const q = query.toLowerCase();

  if (q.includes('low') && q.includes('stock')) {
    const low = (products || []).filter(p => p.stock <= p.minStock);
    if (low.length === 0) return 'Great news — all products are currently above their minimum stock levels. No reorders needed right now.';
    return `Found **${low.length} products** at or below minimum stock:\n\n${low.slice(0, 5).map(p => `• **${p.name}** — ${p.stock} units left (min: ${p.minStock})`).join('\n')}\n\nRecommendation: Create purchase orders for these items to avoid stockouts.`;
  }

  if (q.includes('revenue') || q.includes('sales') || q.includes('summary')) {
    const today = new Date().toISOString().slice(0, 10);
    const monthKey = new Date().toISOString().slice(0, 7);
    const todayOrders = (orders || []).filter(o => o.date?.startsWith(today));
    const monthOrders = (orders || []).filter(o => o.date?.startsWith(monthKey));
    const todayRev = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
    const monthRev = monthOrders.reduce((s, o) => s + (o.total || 0), 0);
    return `**Sales Summary:**\n\n• Today's revenue: **CA$${todayRev.toFixed(2)}** (${todayOrders.length} orders)\n• This month: **CA$${monthRev.toFixed(2)}** (${monthOrders.length} orders)\n• Active customers: **${(customers || []).length}**\n\nYour average order value this month is **CA$${monthOrders.length ? (monthRev / monthOrders.length).toFixed(2) : '0.00'}**.`;
  }

  if (q.includes('top') && (q.includes('product') || q.includes('selling'))) {
    const sorted = [...(products || [])].sort((a, b) => (b.salePrice * (b.minStock || 1)) - (a.salePrice * (a.minStock || 1))).slice(0, 5);
    return `**Top 5 Products by Value:**\n\n${sorted.map((p, i) => `${i + 1}. **${p.name}** — CA$${p.salePrice} · ${p.stock} in stock`).join('\n')}\n\nConsider promoting your high-value items with bundled offers to increase average order value.`;
  }

  if (q.includes('expir')) {
    const soon = (products || []).filter(p => p.expiry && p.status === 'expiring_soon');
    if (soon.length === 0) return 'No products are flagged as expiring soon. Your inventory is in good shape.';
    return `**${soon.length} product(s) expiring soon:**\n\n${soon.map(p => `• **${p.name}** — expires ${p.expiry} · ${p.stock} units remaining`).join('\n')}\n\nConsider offering a discount on these items or returning them to the supplier if possible.`;
  }

  if (q.includes('customer')) {
    const count = (customers || []).length;
    return `You have **${count} customers** in the system.\n\nTop recommendation: Reach out to customers who haven't ordered in 30+ days with a targeted discount to re-engage them.`;
  }

  return `I analyzed your business data based on your query. Here's what I found:\n\n• **Inventory:** ${(products || []).length} products tracked\n• **Orders:** ${(orders || []).length} total orders in system\n• **Customers:** ${(customers || []).length} active customers\n\nFor more specific insights, try asking about low stock, revenue, top products, or expiring items.`;
}

export default function AIAssistant() {
  const { subscription, products, orders, customers, showToast } = useApp();
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hello! I'm your Arwa AI Assistant. Ask me anything about your inventory, sales, customers, or business performance. I analyze your live data to give you instant insights." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const isActive = !!subscription.aiAssistant;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text) => {
    const query = text || input.trim();
    if (!query) return;
    if (!isActive) { showToast('Activate AI Assistant add-on in Subscription to use this feature', 'warning'); return; }

    setMessages(prev => [...prev, { role: 'user', text: query }]);
    setInput('');
    setLoading(true);

    setTimeout(() => {
      const response = generateAIResponse(query, products, orders, customers);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
      setLoading(false);
    }, 900);
  };

  const renderText = (text) => {
    return text.split('\n').map((line, i) => {
      const formatted = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} style={{ margin: '2px 0', fontSize: 13, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: formatted || '&nbsp;' }} />;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div className="page-header-left">
          <h1>AI Assistant</h1>
          <p>Ask anything about your business — powered by your live data</p>
        </div>
        {!isActive && (
          <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600, padding: '6px 12px', background: 'rgba(245,158,11,0.1)', borderRadius: 8, border: '1px solid rgba(245,158,11,0.25)', alignSelf: 'center' }}>
            🤖 Add-on required — activate in Subscription
          </span>
        )}
      </div>

      {/* Chat window */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>
        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                background: msg.role === 'assistant' ? 'linear-gradient(135deg, #7C3AED, #3B82F6)' : 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {msg.role === 'assistant' ? <Bot size={16} color="white" /> : <User size={16} color="white" />}
              </div>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 12,
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderTopRightRadius: msg.role === 'user' ? 2 : 12,
                borderTopLeftRadius: msg.role === 'assistant' ? 2 : 12,
              }}>
                {renderText(msg.text)}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div style={{ padding: '14px 18px', background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 12, borderTopLeftRadius: 2 }}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(d => (
                    <div key={d} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary-light)', animation: `pulse 1.2s ${d * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Quick prompts */}
        <div style={{ padding: '8px 20px', display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
          {QUICK_PROMPTS.map((p, i) => (
            <button key={i} onClick={() => sendMessage(p.label)} disabled={!isActive}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border)', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: 12, cursor: isActive ? 'pointer' : 'not-allowed', opacity: isActive ? 1 : 0.5, whiteSpace: 'nowrap' }}>
              <p.icon size={12} />
              {p.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={isActive ? 'Ask about your sales, inventory, customers...' : 'Activate AI Assistant add-on to start chatting'}
            disabled={!isActive}
            style={{ flex: 1, background: 'var(--bg-tertiary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-family)', outline: 'none', opacity: isActive ? 1 : 0.6 }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!isActive || !input.trim()}
            style={{ width: 42, height: 42, borderRadius: 10, border: 'none', background: 'linear-gradient(135deg, #7C3AED, #3B82F6)', cursor: isActive && input.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: isActive && input.trim() ? 1 : 0.4, flexShrink: 0 }}
          >
            <Send size={16} color="white" />
          </button>
        </div>
      </div>
    </div>
  );
}
