import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState({});
  const [adminId, setAdminId] = useState(localStorage.getItem('admin_auth0id') || '');
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const results = await Promise.allSettled(
        SECTIONS.map(s => api.getActiveSession(s).then(d => d ? { ...d, section: s } : null))
      );
      const active = results
        .filter(r => r.status === 'fulfilled' && r.value)
        .map(r => r.value);
      setSessions(active);
    } catch (e) {
      toast('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleStop(section) {
    if (!adminId.trim()) return toast('Enter your Auth0 ID first to stop sessions', 'error');
    setStopping(s => ({ ...s, [section]: true }));
    try {
      await api.stopSession(adminId.trim(), section);
      toast(`Session for ${section} stopped`, 'success');
      load();
    } catch (e) {
      toast('Failed to stop: ' + e.message, 'error');
    } finally {
      setStopping(s => ({ ...s, [section]: false }));
    }
  }

  function saveAdminId(v) {
    setAdminId(v);
    localStorage.setItem('admin_auth0id', v);
  }

  const elapsed = (date) => {
    const ms = Date.now() - new Date(date).getTime();
    const mins = Math.floor(ms / 60000);
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m ago`;
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Sessions</div>
          <div className="page-subtitle">Monitor &amp; force-stop active attendance sessions</div>
        </div>
        <button className="btn btn-ghost" onClick={load} disabled={loading}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Admin ID needed to stop sessions */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><span className="card-title">Admin Auth0 ID</span><span className="badge badge-amber">Required to stop sessions</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Your Auth0 ID (saved locally)</label>
              <input className="form-input" style={{ maxWidth: 400 }} placeholder="auth0|xxxxxx" value={adminId} onChange={e => saveAdminId(e.target.value)} />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>This is needed because the stop-session API validates teacher ownership. Admins override this by providing their own Auth0 ID.</div>
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Scanning all sections...</span></div>
        ) : sessions.length === 0 ? (
          <div className="card">
            <div className="empty-state" style={{ padding: 60 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{width:40,height:40,opacity:0.3}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <h3>No active sessions</h3>
              <p>All attendance windows are closed across all sections</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <span className="badge badge-green">
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                {sessions.length} active session{sessions.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {sessions.map(s => (
                <div key={s._id || s.section} className="card">
                  <div className="card-header">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-green">
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                        LIVE
                      </span>
                      <span className="badge badge-blue">{s.section}</span>
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleStop(s.section)}
                      disabled={stopping[s.section]}
                    >
                      {stopping[s.section] ? 'Stopping...' : 'Force Stop'}
                    </button>
                  </div>
                  <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <div className="form-label" style={{ marginBottom: 4 }}>Subject</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{s.subject || 'Class Attendance'}</div>
                    </div>
                    <div>
                      <div className="form-label" style={{ marginBottom: 4 }}>OTP</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--accent)', letterSpacing: 6, fontWeight: 700 }}>{s.otp}</div>
                    </div>
                    <div>
                      <div className="form-label" style={{ marginBottom: 4 }}>Teacher ID</div>
                      <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{s.teacherId}</div>
                    </div>
                    <div>
                      <div className="form-label" style={{ marginBottom: 4 }}>Started</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        {new Date(s.startTime || s.createdAt).toLocaleTimeString()}
                        <br />
                        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{elapsed(s.startTime || s.createdAt)}</span>
                      </div>
                    </div>
                    {s.location && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div className="form-label" style={{ marginBottom: 4 }}>Location</div>
                        <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                          {s.location.latitude?.toFixed(6)}, {s.location.longitude?.toFixed(6)}
                          <a
                            href={`https://maps.google.com/?q=${s.location.latitude},${s.location.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{ marginLeft: 8, color: 'var(--accent-blue)', fontSize: 11 }}
                          >
                            View on Maps ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
