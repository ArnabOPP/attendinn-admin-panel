import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';

const SECTIONS = ['A1','A2','A3','A4','A5','A6','A7','A8','A9','A10','B1','B2','B3','B4','B5','B6','B7','B8','B9','B10'];

function AssignmentModal({ assignment, onClose, onSave }) {
  const isNew = !assignment?._id;
  const [form, setForm] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    visibleTo: assignment?.visibleTo || [],
    deadline: assignment?.deadline ? new Date(assignment.deadline).toISOString().slice(0,16) : '',
    auth0Id: localStorage.getItem('admin_auth0id') || '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function toggleSection(s) {
    setForm(f => ({ ...f, visibleTo: f.visibleTo.includes(s) ? f.visibleTo.filter(x => x !== s) : [...f.visibleTo, s] }));
  }

  async function handleSave() {
    if (!form.title || !form.description) return toast('Title and description required', 'error');
    setSaving(true);
    try {
      const body = { ...form, deadline: form.deadline ? new Date(form.deadline) : null };
      if (isNew) await api.createAssignment(body);
      else await api.updateAssignment(assignment._id, body);
      toast(isNew ? 'Assignment created!' : 'Updated!', 'success');
      onSave();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isNew ? 'Create Assignment' : 'Edit Assignment'}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          {isNew && (
            <div className="form-group">
              <label className="form-label">Teacher Auth0 ID</label>
              <input className="form-input" placeholder="auth0|..." value={form.auth0Id} onChange={e => setForm(f => ({ ...f, auth0Id: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Title</label>
            <input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input type="datetime-local" className="form-input" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
          <div className="form-group">
            <div className="flex items-center gap-2" style={{ marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>Visible To</label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, visibleTo: [...SECTIONS] }))}>All</button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setForm(f => ({ ...f, visibleTo: [] }))}>None</button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {SECTIONS.map(s => (
                <button key={s} type="button" onClick={() => toggleSection(s)}
                  className={`badge ${form.visibleTo.includes(s) ? 'badge-amber' : 'badge-gray'}`}
                  style={{ cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function SubmissionsModal({ assignment, onClose }) {
  const subs = assignment.submissions || [];
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <span className="modal-title">Submissions — {assignment.title}</span>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '8px 0' }}>
          {subs.length === 0 ? (
            <div className="empty-state"><p>No submissions yet</p></div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Roll</th>
                  <th>Submitted</th>
                  <th>File</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{s.student?.name || 'Unknown'}</td>
                    <td className="text-mono" style={{ fontSize: 12 }}>{s.student?.roll || '—'}</td>
                    <td style={{ fontSize: 12, fontFamily: 'var(--font-mono)' }}>{new Date(s.submittedAt).toLocaleString()}</td>
                    <td>
                      <a href={s.fileUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ fontSize: 11 }}>
                        View ↗
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function Assignments() {
  const [section, setSection] = useState('A1');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [subsModal, setSubsModal] = useState(null);
  const [deleting, setDeleting] = useState({});
  const toast = useToast();

  async function load() {
    setLoading(true);
    try {
      const data = await api.getAssignmentsBySection(section);
      setAssignments(data);
    } catch (e) {
      toast('Failed to load', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [section]);

  async function handleDelete(id) {
    if (!confirm('Delete this assignment?')) return;
    setDeleting(d => ({ ...d, [id]: true }));
    try {
      await api.deleteAssignment(id);
      toast('Deleted', 'success');
      load();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setDeleting(d => ({ ...d, [id]: false }));
    }
  }

  function isPast(deadline) {
    return deadline && new Date(deadline) < new Date();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Assignments</div>
          <div className="page-subtitle">Manage assignments by section</div>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Assignment
        </button>
      </div>

      <div className="page-body">
        <div className="toolbar" style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ whiteSpace: 'nowrap' }}>Section</label>
          <select className="form-input" style={{ width: 130 }} value={section} onChange={e => setSection(e.target.value)}>
            {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : assignments.length === 0 ? (
          <div className="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <h3>No assignments for {section}</h3>
          </div>
        ) : (
          <div className="card">
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Deadline</th>
                    <th>Submissions</th>
                    <th>Sections</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {assignments.map(a => (
                    <tr key={a._id}>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.title}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.description?.slice(0, 60)}...</div>
                      </td>
                      <td>
                        {a.deadline ? (
                          <span className={`badge ${isPast(a.deadline) ? 'badge-red' : 'badge-green'}`}>
                            {isPast(a.deadline) ? 'Closed' : new Date(a.deadline).toLocaleDateString()}
                          </span>
                        ) : <span className="badge badge-gray">No deadline</span>}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => setSubsModal(a)}>
                          {a.submissions?.length || 0} submissions
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(a.visibleTo || []).slice(0, 4).map(s => <span key={s} className="badge badge-gray" style={{ fontSize: 10 }}>{s}</span>)}
                          {a.visibleTo?.length > 4 && <span className="badge badge-gray" style={{ fontSize: 10 }}>+{a.visibleTo.length - 4}</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal(a)}>Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(a._id)} disabled={deleting[a._id]}>
                            {deleting[a._id] ? '...' : 'Del'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modal && <AssignmentModal assignment={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />}
      {subsModal && <SubmissionsModal assignment={subsModal} onClose={() => setSubsModal(null)} />}
    </div>
  );
}
