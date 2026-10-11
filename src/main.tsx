import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Calabar Connect City render failure:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main style={{ minHeight: '100vh', padding: '32px 20px', display: 'grid', placeContent: 'center', fontFamily: 'system-ui, sans-serif', color: '#263e30', background: '#f8f8f5' }}>
          <section style={{ maxWidth: 440 }}>
            <h1>Calabar Connect City could not load</h1>
            <p>Something went wrong while opening the page. Reload the website to try again. If the problem continues, share this message with support.</p>
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
