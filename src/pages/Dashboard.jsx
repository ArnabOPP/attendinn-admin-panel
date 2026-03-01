import { useState, useEffect } from 'react';
import { api } from '../utils/api';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];

function StatCard({ label, value, color, meta }) {
  return (
    <div className={`stat-card ${color}`}>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSessions, setActiveSessions] = useState([]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // Fetch stats for all sections in parallel
        const results = await Promise.allSettled(
          SECTIONS.map(s => api.getAttendanceStats(s).then(d => ({ section: s, ...d })))
        );
        const sessionResults = await Promise.allSettled(
          SECTIONS.map(s => api.getActiveSession(s).then(d => d ? { section: s, ...d } : null))
        );

        const sectionStats = results
          .filter(r => r.status === 'fulfilled')
          .map(r => r.value);

        const sessions = sessionResults
          .filter(r => r.status === 'fulfilled' && r.value)
          .map(r => r.value);

        const totalPresent = sectionStats.reduce((a, s) => a + (s.marked?.length || 0), 0);
        const totalScanned = sectionStats.reduce((a, s) => a + (s.scanned?.length || 0), 0);
        const totalAbsent = sectionStats.reduce((a, s) => a + (s.absent?.length || 0), 0);
        const totalStudents = totalPresent + totalScanned + totalAbsent;

        setStats({ totalPresent, totalScanned, totalAbsent, totalStudents, sectionStats });
        setActiveSessions(sessions);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const attendanceRate = stats.totalStudents > 0
    ? Math.round(((stats.totalPresent || 0) / stats.totalStudents) * 100)
    : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-subtitle">Live overview · auto-refreshes every 30s</div>
        </div>
        <div className="badge badge-green" style={{ alignSelf: 'flex-start' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          LIVE
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading-center"><div className="spinner" /><span>Loading live data...</span></div>
        ) : (
          <>
            <div className="stat-grid">
              <StatCard label="Total Students" value={stats.totalStudents} color="blue" meta="across all sections" />
              <StatCard label="OTP Marked" value={stats.totalPresent} color="green" meta="verified in class" />
              <StatCard label="At Door (RFID)" value={stats.totalScanned} color="amber" meta="scanned, pending OTP" />
              <StatCard label="Absent" value={stats.totalAbsent} color="red" meta="not on campus" />
              <StatCard label="Attendance Rate" value={`${attendanceRate}%`} color="blue" meta="present / total" />
              <StatCard label="Active Sessions" value={activeSessions.length} color="amber" meta="ongoing right now" />
            </div>

            {activeSessions.length > 0 && (
              <div className="card mt-6">
                <div className="card-header">
                  <span className="card-title">Active Sessions Now</span>
                  <span className="badge badge-green">
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                    {activeSessions.length} live
                  </span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Section</th>
                        <th>Subject</th>
                        <th>OTP</th>
                        <th>Started</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeSessions.map(s => (
                        <tr key={s._id}>
                          <td><span className="badge badge-blue">{s.section}</span></td>
                          <td className="font-bold" style={{ color: 'var(--text-primary)' }}>{s.subject}</td>
                          <td><code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 16, letterSpacing: 4 }}>{s.otp}</code></td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{new Date(s.startTime || s.createdAt).toLocaleTimeString()}</td>
                          <td><span className="badge badge-green">Active</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="card mt-6">
              <div className="card-header">
                <span className="card-title">Section Breakdown</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Section</th>
                      <th>Marked (OTP)</th>
                      <th>At Door</th>
                      <th>Absent</th>
                      <th>Total</th>
                      <th>Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.sectionStats || []).map(s => {
                      const total = (s.marked?.length || 0) + (s.scanned?.length || 0) + (s.absent?.length || 0);
                      if (total === 0) return null;
                      const rate = total > 0 ? Math.round(((s.marked?.length || 0) / total) * 100) : 0;
                      return (
                        <tr key={s.section}>
                          <td><span className="badge badge-gray">{s.section}</span></td>
                          <td className="text-green font-bold">{s.marked?.length || 0}</td>
                          <td className="text-amber">{s.scanned?.length || 0}</td>
                          <td className="text-red">{s.absent?.length || 0}</td>
                          <td style={{ color: 'var(--text-primary)' }}>{total}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, minWidth: 60 }}>
                                <div style={{ width: `${rate}%`, height: '100%', background: rate > 75 ? 'var(--accent-green)' : rate > 50 ? 'var(--accent)' : 'var(--accent-red)', borderRadius: 2, transition: 'width 0.3s' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
