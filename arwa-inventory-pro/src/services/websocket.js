// websocket.js — WebSocket client for real-time order sync
// Connects to the Arwa Order Sync Backend, auto-reconnects on drop,
// and calls registered handlers when events arrive.

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:4000/ws';
const WS_KEY = process.env.REACT_APP_WS_KEY || 'arwa_dev_key';

class ArwaWebSocket {
  constructor() {
    this.ws           = null;
    this.handlers     = {};       // event → [fn, ...]
    this.retryDelay   = 1000;
    this.maxRetry     = 30000;
    this.retryTimer   = null;
    this.manualClose  = false;
    this.status       = 'disconnected'; // disconnected | connecting | connected
    this.onStatusChange = null;   // callback(status)
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    this._setStatus('connecting');
    this.manualClose = false;

    try {
      const url = `${WS_URL}?key=${WS_KEY}`;
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('[WS] Failed to create socket:', err.message);
      this._scheduleRetry();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WS] Connected to order sync server');
      this._setStatus('connected');
      this.retryDelay = 1000; // reset backoff
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this._dispatch(msg.event, msg.data);
      } catch {
        // ignore malformed messages
      }
    };

    this.ws.onclose = (e) => {
      this._setStatus('disconnected');
      if (!this.manualClose) {
        console.warn(`[WS] Disconnected (code ${e.code}) — retrying in ${this.retryDelay / 1000}s`);
        this._scheduleRetry();
      }
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err.message || 'connection failed');
      // onclose will fire next and handle retry
    };
  }

  disconnect() {
    this.manualClose = true;
    clearTimeout(this.retryTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this._setStatus('disconnected');
  }

  send(event, data = {}) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, ...data }));
    }
  }

  // Register an event handler: on('new_order', fn)
  on(event, fn) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(fn);
    return () => this.off(event, fn);
  }

  off(event, fn) {
    if (!this.handlers[event]) return;
    this.handlers[event] = this.handlers[event].filter(h => h !== fn);
  }

  _dispatch(event, data) {
    (this.handlers[event] || []).forEach(fn => { try { fn(data); } catch { /* ignore */ } });
    (this.handlers['*'] || []).forEach(fn => { try { fn(event, data); } catch { /* ignore */ } });
  }

  _setStatus(status) {
    this.status = status;
    if (this.onStatusChange) this.onStatusChange(status);
  }

  _scheduleRetry() {
    clearTimeout(this.retryTimer);
    this.retryTimer = setTimeout(() => {
      this.retryDelay = Math.min(this.retryDelay * 2, this.maxRetry);
      this.connect();
    }, this.retryDelay);
  }

  // Convenience: request fresh snapshot from server
  requestSnapshot() {
    this.send('get_snapshot');
  }

  // Update order status via server (broadcasts to all connected clients)
  updateOrderStatus(orderId, status) {
    this.send('update_status', { orderId, status });
  }

  getStatus() { return this.status; }
  isConnected() { return this.status === 'connected'; }
}

// Singleton
const wsClient = new ArwaWebSocket();
export default wsClient;
