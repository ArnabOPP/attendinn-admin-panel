import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';

const BASE = 'https://attendinn-backend.vercel.app/api';
const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];

async function getAllUsers() {
  // We query each section's stats to collect the student lists
  // Also fetch teachers via leaderboard (they aren't in section stats)
  const sectionResults = await Promise.allSettled(
    SECTIONS.map(s =>
      fetch(`${BASE}/attendance/stats/${s}`).then(r => r.json()).then(d => [
        ...(d.marked || []),
        ...(d.scanned || []),
        ...(d.absent || [])
      ])
    )
  );

  const seen = new Set();
  const users = [];
  sectionResults.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      r.value.forEach(u => {
        if (!seen.has(u._id)) {
          seen.add(u._id);
          users.push({ ...u, section: SECTIONS[i], role: 'student' });
        }
      });
    }
  });
  return users;
}

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    roll: user?.roll || '',
    section: user?.section || '',
    uid: user?.uid || '',
    role: user?.role || 'student',
    auth0Id: user?.auth0Id || '',
    enrollment_number: user?.enrollment_number || '',
    stream: user?.stream || '',
    course: user?.course || '',
    campus: user?.campus || '',
    blood_group: user?.blood_group || '',
    father_name: user?.father_name || '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  const isNew = !user?._id;

  async function handleSave() {
    if (!form.name || !form.email) return toast('Name and email required', 'error');
    if (isNew && !form.auth0Id) return toast('Auth0 ID required for new users', 'error');
    setSaving(true);
    try {
      await api.registerUser(form);
      toast(isNew ? 'User created!' : 'User updated!', 'success');
      onSave();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const field = (label, key, type = 'text', options = null) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {options ? (
        <select className="form-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}>
          <option value="">— Select —</option>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} className="form-input" value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
      )}
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'Add New User' : `Edit — ${user.name}`}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="two-col">
            {field('Full Name *', 'name')}
            {field('Email *', 'email', 'email')}
          </div>
          <div className="two-col">
            {field('Auth0 ID *', 'auth0Id')}
            {field('Role', 'role', 'text', ['student', 'teacher'])}
          </div>
          <div className="two-col">
            {field('Roll Number', 'roll')}
            {field('Enrollment No.', 'enrollment_number')}
          </div>
          <div className="two-col">
            {field('Section', 'section', 'text', SECTIONS)}
            {field('Stream', 'stream')}
          </div>
          <div className="two-col">
            {field('Course', 'course')}
            {field('Campus', 'campus')}
          </div>
          <div className="two-col">
            {field('RFID UID', 'uid')}
            {field('Blood Group', 'blood_group')}
          </div>
          {field('Father Name', 'father_name')}
          <div style={{ background: 'var(--accent-glow)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--accent)' }}>Note:</strong> Auth0 ID must match the user's Auth0 account. RFID UID must match what's written on the physical card.
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Create User' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSection, setFilterSection] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [modal, setModal] = useState(null); // null | 'new' | user object
  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState(null);
  const [looking, setLooking] = useState(false);
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (e) {
      toast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleLookup() {
    if (!lookupId.trim()) return;
    setLooking(true);
    setLookupResult(null);
    try {
      const u = await api.getUser(lookupId.trim());
      setLookupResult(u);
    } catch (e) {
      setLookupResult({ error: e.message });
    } finally {
      setLooking(false);
    }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.name?.toLowerCase().includes(q) || u.roll?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchSection = !filterSection || u.section === filterSection;
    const matchRole = !filterRole || u.role === filterRole;
    return matchSearch && matchSection && matchRole;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Users</div>
          <div className="page-subtitle">{users.length} total · students &amp; teachers</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add User
        </button>
      </div>

      <div className="page-body">
        {/* Lookup by Auth0 ID */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title">Lookup by Auth0 ID</span>
          </div>
          <div className="card-body">
            <div className="flex gap-3" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Auth0 ID</label>
                <input className="form-input" placeholder="auth0|xxxxxx" value={lookupId} onChange={e => setLookupId(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLookup()} />
              </div>
              <button className="btn btn-ghost" onClick={handleLookup} disabled={looking}>{looking ? 'Looking...' : 'Lookup'}</button>
            </div>
            {lookupResult && (
              <div style={{ marginTop: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 }}>
                {lookupResult.error ? (
                  <span className="text-red">{lookupResult.error}</span>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {Object.entries(lookupResult).filter(([k]) => !['__v', 'createdAt', 'updatedAt'].includes(k)).map(([k, v]) => (
                      <div key={k}>
                        <div className="text-xs text-muted text-mono">{k}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-primary)', wordBreak: 'break-all' }}>{String(v) || '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="toolbar" style={{ marginBottom: 12 }}>
          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search by name, roll, email..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: 130 }} value={filterSection} onChange={e => setFilterSection(e.target.value)}>
            <option value="">All Sections</option>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-input" style={{ width: 120 }} value={filterRole} onChange={e => setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
        </div>

        <div className="card">
          {loading ? (
            <div className="loading-center"><div className="spinner" /><span>Loading users...</span></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <h3>No users found</h3>
              <p>Try adjusting your filters</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll</th>
                    <th>Section</th>
                    <th>Role</th>
                    <th>At Door</th>
                    <th>RFID</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u._id || i}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{u.email}</div>
                      </td>
                      <td className="text-mono" style={{ fontSize: 12 }}>{u.roll || '—'}</td>
                      <td><span className="badge badge-gray">{u.section || '—'}</span></td>
                      <td><span className={`badge ${u.role === 'teacher' ? 'badge-amber' : 'badge-blue'}`}>{u.role}</span></td>
                      <td>
                        <span className={`badge ${u.at_door ? 'badge-green' : 'badge-gray'}`}>
                          {u.at_door ? '✓ Yes' : 'No'}
                        </span>
                      </td>
                      <td className="text-mono" style={{ fontSize: 11 }}>{u.uid || <span className="text-muted">not set</span>}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setModal(u)}>Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Showing {filtered.length} of {users.length} users
        </div>
      </div>

      {modal && (
        <UserModal
          user={modal === 'new' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
