import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];

function NoticeModal({ notice, adminAuth0Id, onClose, onSave }) {
  const isNew = !notice?._id;
  const [form, setForm] = useState({
    title: notice?.title || '',
    content: notice?.content || '',
    visibleTo: notice?.visibleTo || [],
    links: (notice?.links || []).join('\n'),
    auth0Id: adminAuth0Id || '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function toggleSection(s) {
    setForm(f => ({
      ...f,
      visibleTo: f.visibleTo.includes(s) ? f.visibleTo.filter(x => x !== s) : [...f.visibleTo, s]
    }));
  }

  function selectAll() { setForm(f => ({ ...f, visibleTo: [...SECTIONS] })); }
  function clearAll() { setForm(f => ({ ...f, visibleTo: [] })); }

  async function handleSave() {
    if (!form.title || !form.content) return toast('Title and content required', 'error');
    if (form.visibleTo.length === 0) return toast('Select at least one section', 'error');
    setSaving(true);
    try {
      const body = {
        title: form.title,
        content: form.content,
        visibleTo: form.visibleTo,
        links: form.links.split('\n').map(l => l.trim()).filter(Boolean),
        auth0Id: form.auth0Id,
      };
      if (isNew) {
        await api.createNotice(body);
      } else {
        await api.updateNotice(notice._id, body);
      }
      toast(isNew ? 'Notice published!' : 'Notice updated!', 'success');
      onSave();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'Publish Notice' : 'Edit Notice'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {isNew && (
            <div className="form-group">
              <label className="form-label">Teacher Auth0 ID (author)</label>
              <input className="form-input" placeholder="auth0|..." value={form.auth0Id} onChange={e => setForm(f => ({ ...f, auth0Id: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" placeholder="Notice title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea className="form-input" rows={5} placeholder="Notice body..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Links (one per line)</label>
            <textarea className="form-input" rows={2} placeholder="https://..." value={form.links} onChange={e => setForm(f => ({ ...f, links: e.target.value }))} style={{ resize: 'none', fontFamily: 'var(--font-mono)', fontSize: 12 }} />
          </div>
          <div className="form-group">
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Visible To</label>
              <button className="btn btn-ghost btn-sm" onClick={selectAll} type="button">All</button>
              <button className="btn btn-ghost btn-sm" onClick={clearAll} type="button">None</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSection(s)}
                  className={`badge ${form.visibleTo.includes(s) ? 'badge-amber' : 'badge-gray'}`}
                  style={{ cursor: 'pointer', border: '1px solid', transition: 'all 0.1s' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : isNew ? 'Publish' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState({});
  const [adminAuth0Id, setAdminAuth0Id] = useState(localStorage.getItem('admin_auth0id') || '');
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAllNotices();
      setNotices(data);
    } catch (e) {
      toast('Failed to load notices', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id) {
    if (!confirm('Delete this notice?')) return;
    setDeleting(d => ({ ...d, [id]: true }));
    try {
      await api.deleteNotice(id);
      toast('Deleted', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDeleting(d => ({ ...d, [id]: false }));
    }
  }

  const filtered = notices.filter(n =>
    !search || n.title?.toLowerCase().includes(search.toLowerCase()) || n.content?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Notices</div>
          <div className="page-subtitle">{notices.length} total notices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Notice
        </button>
      </div>

      <div className="page-body">
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <div className="search-wrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Search notices..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/></svg>
            <h3>No notices</h3>
            <p>Create the first notice above</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(n => (
              <div key={n._id} className="card">
                <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(n.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, lineHeight: 1.6 }}>{n.content}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {(n.visibleTo || []).map(s => (
                        <span key={s} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>
                      ))}
                    </div>
                    {n.links?.length > 0 && (
                      <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {n.links.map((l, i) => (
                          <a key={i} href={l} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'underline' }}>
                            Link {i + 1} ↗
                          </a>
                        ))}
                      </div>
                    )}
                    {n.author && (
                      <div style={{ marginTop: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                        By: {n.author.name} ({n.author.role})
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => setModal(n)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n._id)} disabled={deleting[n._id]}>
                      {deleting[n._id] ? '...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <NoticeModal
          notice={modal === 'new' ? null : modal}
          adminAuth0Id={adminAuth0Id}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
