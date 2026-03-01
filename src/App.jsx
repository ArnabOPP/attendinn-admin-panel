import { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Attendance from './pages/Attendance';
import Sessions from './pages/Sessions';
import Notices from './pages/Notices';
import Assignments from './pages/Assignments';
import Leaderboard from './pages/Leaderboard';

const PAGES = {
  dashboard: Dashboard,
  users: Users,
  attendance: Attendance,
  sessions: Sessions,
  notices: Notices,
  assignments: Assignments,
  leaderboard: Leaderboard,
};

function LoginScreen() {
  const { loginWithRedirect, isLoading } = useAuth0();
  return (
    <div className="login-screen">
      <div className="login-grid" />
      <div className="login-card">
        <div className="login-logo">AttendInn</div>
        <div className="login-badge">Admin Console</div>
        <div className="login-title">Welcome back</div>
        <div className="login-desc">
          Sign in with your institutional Auth0 account to access the admin dashboard.
        </div>
        <button
          className="btn btn-primary w-full"
          style={{ justifyContent: 'center', padding: '12px', fontSize: 14 }}
          onClick={() => loginWithRedirect()}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Sign in with Auth0'}
        </button>
        <div style={{ marginTop: 20, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Only admin accounts have access
        </div>
      </div>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="login-screen">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>
          Authenticating...
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoading } = useAuth0();
  const [page, setPage] = useState('dashboard');

  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <LoginScreen />;

  const PageComponent = PAGES[page] || Dashboard;

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={setPage} />
      <main className="main-content">
        <PageComponent />
      </main>
    </div>
  );
}
