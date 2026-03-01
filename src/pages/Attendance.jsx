import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];
const BASE = 'https://attendinn-backend.vercel.app/api';

export default function Attendance() {
  const [tab, setTab] = useState('live'); // live | records
  const [section, setSection] = useState('A1');
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authId, setAuthId] = useState('');
  const [records, setRecords] = useState([]);
  const [recLoading, setRecLoading] = useState(false);
  const toast = useToast();

  async function loadLive() {
    setLoading(true);
    try {
      const data = await api.getAttendanceStats(section);
      setLiveData(data);
    } catch (e) {
      toast('Failed to load stats: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadRecords() {
    if (!authId.trim()) return toast('Enter an Auth0 ID', 'error');
    setRecLoading(true);
    try {
      const data = await api.getAttendance(authId.trim());
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      toast('Failed: ' + e.message, 'error');
      setRecords([]);
    } finally {
      setRecLoading(false);
    }
  }

  useEffect(() => { if (tab === 'live') loadLive(); }, [section, tab]);

  function exportCSV() {
    if (!records.length) return;
    const rows = [['Date', 'Subject', 'Status', 'Offline', 'Session ID']];
    records.forEach(r => rows.push([
      new Date(r.date).toLocaleString(),
      r.subject,
      r.status,
      r.isOffline ? 'Yes' : 'No',
      r.sessionId || 'N/A'
    ]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'attendance.csv'; a.click();
  }

  const total = (liveData?.marked?.length || 0) + (liveData?.scanned?.length || 0) + (liveData?.absent?.length || 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Attendance</div>
          <div className="page-subtitle">Live section view &amp; individual record lookup</div>
        </div>
      </div>

      <div className="page-body">
        <div className="tabs" style={{ maxWidth: 340, marginBottom: 20 }}>
          <button className={`tab ${tab === 'live' ? 'active' : ''}`} onClick={() => setTab('live')}>Live View</button>
          <button className={`tab ${tab === 'records' ? 'active' : ''}`} onClick={() => setTab('records')}>User Records</button>
        </div>

        {tab === 'live' && (
          <>
            <div className="toolbar" style={{ marginBottom: 16 }}>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <label className="form-label" style={{ whiteSpace: 'nowrap' }}>Section</label>
                <select className="form-input" style={{ width: 120 }} value={section} onChange={e => setSection(e.target.value)}>
                  {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <button className="btn btn-ghost" onClick={loadLive} disabled={loading}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                Refresh
              </button>
            </div>

            {loading ? (
              <div className="loading-center"><div className="spinner" /><span>Loading {section}...</span></div>
            ) : liveData ? (
              <>
                <div className="stat-grid" style={{ marginBottom: 20 }}>
                  <div className="stat-card green">
                    <div className="stat-label">OTP Marked</div>
                    <div className="stat-value">{liveData.marked?.length || 0}</div>
                    <div className="stat-meta">verified in class</div>
                  </div>
                  <div className="stat-card amber">
                    <div className="stat-label">At Door (RFID)</div>
                    <div className="stat-value">{liveData.scanned?.length || 0}</div>
                    <div className="stat-meta">pending OTP</div>
                  </div>
                  <div className="stat-card red">
                    <div className="stat-label">Absent</div>
                    <div className="stat-value">{liveData.absent?.length || 0}</div>
                    <div className="stat-meta">not in system today</div>
                  </div>
                  <div className="stat-card blue">
                    <div className="stat-label">Total</div>
                    <div className="stat-value">{total}</div>
                    <div className="stat-meta">students in section</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {[
                    { key: 'marked', label: 'OTP Marked', color: 'var(--accent-green)', badge: 'badge-green' },
                    { key: 'scanned', label: 'At Door (RFID)', color: 'var(--accent)', badge: 'badge-amber' },
                    { key: 'absent', label: 'Absent', color: 'var(--accent-red)', badge: 'badge-red' },
                  ].map(({ key, label, badge }) => (
                    <div key={key} className="card">
                      <div className="card-header">
                        <span className="card-title">{label}</span>
                        <span className={`badge ${badge}`}>{liveData[key]?.length || 0}</span>
                      </div>
                      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                        {(liveData[key] || []).length === 0 ? (
                          <div className="empty-state" style={{ padding: 24 }}>
                            <p>No students</p>
                          </div>
                        ) : (
                          <table>
                            <tbody>
                              {(liveData[key] || []).map((s, i) => (
                                <tr key={s._id || i}>
                                  <td>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{s.name}</div>
                                    <div style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{s.roll}</div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state"><p>Select a section to view attendance</p></div>
            )}
          </>
        )}

        {tab === 'records' && (
          <>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Look up by Auth0 ID</span></div>
              <div className="card-body">
                <div className="flex gap-3" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="form-label">Auth0 ID</label>
                    <input className="form-input" placeholder="auth0|xxxxxx" value={authId} onChange={e => setAuthId(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadRecords()} />
                  </div>
                  <button className="btn btn-primary" onClick={loadRecords} disabled={recLoading}>{recLoading ? 'Loading...' : 'Fetch Records'}</button>
                  {records.length > 0 && (
                    <button className="btn btn-ghost" onClick={exportCSV}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width:14,height:14}}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                      Export CSV
                    </button>
                  )}
                </div>
              </div>
            </div>

            {recLoading ? (
              <div className="loading-center"><div className="spinner" /></div>
            ) : records.length > 0 ? (
              <div className="card">
                <div className="card-header">
                  <span className="card-title">Attendance History</span>
                  <span className="badge badge-blue">{records.length} records</span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Subject</th>
                        <th>Status</th>
                        <th>Type</th>
                        <th>Session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={r._id || i}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {new Date(r.date).toLocaleDateString()}<br />
                            <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{new Date(r.date).toLocaleTimeString()}</span>
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{r.subject}</td>
                          <td><span className={`badge ${r.status === 'present' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                          <td>
                            {r.isOffline
                              ? <span className="badge badge-amber">Offline Sync</span>
                              : <span className="badge badge-blue">Online</span>}
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                            {r.sessionId ? r.sessionId.slice(-8) + '...' : <span className="text-muted">Door Scan</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : authId && !recLoading ? (
              <div className="empty-state"><p>No records found for this Auth0 ID</p></div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
