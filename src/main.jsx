import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles.css';

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('Calabar Connect City render error:', error, info?.componentStack);
  }
  render() {
    if (this.state.error) {
      return <main style={{fontFamily:'system-ui,sans-serif',maxWidth:680,margin:'12vh auto',padding:24,color:'#17262e'}}>
        <div style={{fontSize:12,letterSpacing:2,color:'#1b765d',fontWeight:800}}>CALABAR CONNECT CITY</div>
        <h1 style={{fontSize:32,marginBottom:8}}>We hit a loading problem.</h1>
        <p style={{color:'#5f6f73',lineHeight:1.7}}>The page caught an error instead of showing a blank screen. Reload once; if it continues, send this error to support so it can be fixed.</p>
        <pre style={{whiteSpace:'pre-wrap',overflowWrap:'anywhere',background:'#f2f5f3',padding:16,borderRadius:10,fontSize:12}}>{String(this.state.error?.message || this.state.error)}</pre>
        <button onClick={() => window.location.reload()} style={{background:'#1b765d',color:'#fff',border:0,borderRadius:8,padding:'12px 18px',fontWeight:700}}>Reload website</button>
      </main>;
    }
    return this.props.children;
  }
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>);
} else {
  document.body.innerHTML = '<main style="font-family:system-ui;padding:24px"><h1>Calabar Connect City</h1><p>The app root element is missing. Please check the Vercel root directory and index.html.</p></main>';
}