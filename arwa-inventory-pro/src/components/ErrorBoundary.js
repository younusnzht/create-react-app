import React from 'react';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#0F172A', flexDirection: 'column', gap: 24, padding: 20, textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72,
            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
            borderRadius: 18,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 900, color: 'white',
            boxShadow: '0 0 30px rgba(79,70,229,0.4)',
          }}>A</div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#F1F5F9', marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ fontSize: 14, color: '#64748B', maxWidth: 400 }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 28px',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              color: 'white', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(79,70,229,0.4)',
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
