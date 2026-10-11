import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Calabar Connect City render failure:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', display: 'grid', placeContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#263e30', background: '#f8f8f5' }}>
          <section style={{ maxWidth: 560, background: '#fff', padding: 24, borderRadius: 16, border: '1px solid #dfe6dc', overflowWrap: 'anywhere' }}>
            <h1 style={{ marginTop: 0 }}>Calabar Connect City could not load</h1>
            <p>The page encountered a rendering error. Your account and community data have not been deleted.</p>
            <p style={{ fontSize: 13, color: '#8b2929' }}><strong>Error:</strong> {this.state.error.message || 'Unknown rendering error'}</p>
            <button onClick={() => window.location.reload()} style={{ padding: '12px 18px', border: 0, borderRadius: 8, color: '#fff', background: '#315a40', cursor: 'pointer' }}>Reload website</button>
          </section>
        </main>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
);
