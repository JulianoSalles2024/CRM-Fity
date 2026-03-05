
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from '@/src/features/auth/AuthContext';
import AuthGate from '@/src/features/auth/AuthGate';
import InvitePage, { InvalidTokenPage } from '@/src/pages/InvitePage';
import { InstallProvider } from '@/src/features/install/context/InstallContext';
import InstallRouter from '@/src/features/install/InstallRouter';

const safeError = (...args: unknown[]) => {
  try { console.error(...args); } catch { /* ignore */ }
};

// ── TEMPORARY Error Boundary for diagnosis ──────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    safeError('🔴 ERROR BOUNDARY CAUGHT:', error.message);
    safeError('🔴 Component stack:', info.componentStack);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: 'red', background: '#1a0000', padding: '2rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <h2>🔴 Erro capturado pelo Error Boundary:</h2>
          <p>{this.state.error.message}</p>
          <p>{this.state.error.stack}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Invite route interception ──────────────────────────────
const inviteMatch = window.location.pathname.match(/^\/invite\/(.+)$/);
// ── Install wizard route interception ──────────────────────
const installMatch = window.location.pathname.match(/^\/install\/(.+)$/);

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

if (installMatch) {
  root.render(
    <React.StrictMode>
      <InstallProvider>
        <InstallRouter />
      </InstallProvider>
    </React.StrictMode>
  );
} else if (inviteMatch) {
  const token = inviteMatch[1]?.trim();
  root.render(
    <React.StrictMode>
      {token ? <InvitePage token={token} /> : <InvalidTokenPage />}
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <AuthGate>
            <App />
          </AuthGate>
        </AuthProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
