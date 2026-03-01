import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];
const MEDALS = ['🥇', '🥈', '🥉'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-primary)', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export default function Leaderboard() {
  const [data, setData] = useState([]);
  const [sectionData, setSectionData] = useState({});
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [scope, setScope] = useState('global');
  const [section, setSection] = useState('A1');
  const [expandedSection, setExpandedSection] = useState(null);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const params = { scope };
      if (scope === 'class') params.section = section;
      const result = await api.getLeaderboard(params);
      setData(result);
    } catch (e) {
      toast('Failed to load leaderboard', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function loadAllSections() {
    setSectionLoading(true);
    try {
      const results = await Promise.allSettled(
        SECTIONS.map(s => api.getLeaderboard({ scope: 'class', section: s }).then(d => ({ section: s, top: d.slice(0, 3) })))
      );
      const map = {};
      results.forEach(r => {
        if (r.status === 'fulfilled') map[r.value.section] = r.value.top;
      });
      setSectionData(map);
    } catch (e) {
      toast('Failed to load section breakdown', 'error');
    } finally {
      setSectionLoading(false);
    }
  }

  useEffect(() => { load(); }, [scope, section]);
  useEffect(() => { if (scope === 'global') loadAllSections(); }, [scope]);

  const top10 = data.slice(0, 10);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Leaderboard</div>
          <div className="page-subtitle">Top students by score — attendance × 10 + assignments × 20</div>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar" style={{ marginBottom: 20 }}>
          <div className="tabs" style={{ maxWidth: 260 }}>
            <button className={`tab ${scope === 'global' ? 'active' : ''}`} onClick={() => setScope('global')}>Global</button>
            <button className={`tab ${scope === 'class' ? 'active' : ''}`} onClick={() => setScope('class')}>By Section</button>
          </div>
          {scope === 'class' && (
            <select className="form-input" style={{ width: 130 }} value={section} onChange={e => setSection(e.target.value)}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : data.length === 0 ? (
          <div className="empty-state"><h3>No data</h3><p>No students found</p></div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>
              <div>
                {/* Chart */}
                <div className="card" style={{ marginBottom: 20 }}>
                  <div className="card-header"><span className="card-title">Top 10 Scores</span></div>
                  <div style={{ padding: '16px 8px' }}>
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={top10} margin={{ left: -10 }}>
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}
                          tickFormatter={n => n.split(' ')[0]} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(245,158,11,0.05)' }} />
                        <Bar dataKey="score" name="Score" radius={[4,4,0,0]}>
                          {top10.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#cd7c32' : 'var(--accent-blue)'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Full rankings table */}
                <div className="card">
                  <div className="card-header">
                    <span className="card-title">Full Rankings</span>
                    <span className="badge badge-gray">{data.length} students</span>
                  </div>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Student</th>
                          <th>Roll</th>
                          <th>Score</th>
                          <th>Attendance</th>
                          <th>Submissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((s, i) => (
                          <tr key={i}>
                            <td style={{ fontFamily: 'var(--font-mono)', width: 40 }}>
                              {MEDALS[i] || <span style={{ color: 'var(--text-muted)' }}>{i + 1}</span>}
                            </td>
                            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</td>
                            <td className="text-mono" style={{ fontSize: 12 }}>{s.roll || '—'}</td>
                            <td>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text-primary)', fontSize: 15 }}>
                                {s.score}
                              </span>
                            </td>
                            <td><span className="badge badge-green">{s.attendanceCount} present</span></td>
                            <td><span className="badge badge-blue">{s.submissionCount} submitted</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Podium sidebar */}
              <div style={{ position: 'sticky', top: 0 }}>
                <div className="card">
                  <div className="card-header"><span className="card-title">Top 3 Podium</span></div>
                  <div className="card-body">
                    {data.slice(0, 3).map((s, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                        borderBottom: i < 2 ? '1px solid var(--border)' : 'none'
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: i === 0 ? 'rgba(245,158,11,0.15)' : i === 1 ? 'rgba(148,163,184,0.1)' : 'rgba(205,124,50,0.1)',
                          border: `2px solid ${i === 0 ? 'var(--accent)' : i === 1 ? '#94a3b8' : '#cd7c32'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16
                        }}>
                          {MEDALS[i]}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 13 }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{s.roll}</div>
                        </div>
                        <div style={{
                          fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 18,
                          color: i === 0 ? 'var(--accent)' : i === 1 ? '#94a3b8' : '#cd7c32'
                        }}>
                          {s.score}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section Breakdown — only shown in global mode */}
            {scope === 'global' && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div className="card-title" style={{ fontSize: 13 }}>Section Breakdown</div>
                  {sectionLoading && <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />}
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Top 3 per section — click to expand
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {SECTIONS.map(sec => {
                    const tops = sectionData[sec] || [];
                    const isExpanded = expandedSection === sec;
                    const hasData = tops.length > 0;

                    return (
                      <div
                        key={sec}
                        className="card"
                        style={{ cursor: hasData ? 'pointer' : 'default', transition: 'border-color 0.15s' }}
                        onClick={() => hasData && setExpandedSection(isExpanded ? null : sec)}
                      >
                        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span className="badge badge-blue" style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{sec}</span>
                            {hasData ? (
                              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                🥇 {tops[0]?.name?.split(' ')[0]}
                                {tops[0]?.score !== undefined && (
                                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginLeft: 6, fontSize: 11 }}>
                                    {tops[0].score}pts
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>No data</span>
                            )}
                          </div>
                          {hasData && (
                            <span style={{ color: 'var(--text-muted)', fontSize: 12, transition: 'transform 0.2s', display: 'inline-block', transform: isExpanded ? 'rotate(180deg)' : 'none' }}>▾</span>
                          )}
                        </div>

                        {isExpanded && tops.length > 0 && (
                          <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0' }}>
                            {tops.map((s, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px' }}>
                                <span style={{ fontSize: 14, width: 20, textAlign: 'center' }}>{MEDALS[i]}</span>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</div>
                                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                    {s.attendanceCount} att · {s.submissionCount} sub
                                  </div>
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>{s.score}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
