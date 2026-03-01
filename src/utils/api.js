const BASE = 'https://attendinn-backend.vercel.app/api';

async function req(path, options = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Users ─────────────────────────────────────────────────────────────────
export const api = {
  // Get user by auth0Id
  getUser: (auth0Id) => req(`/users/${auth0Id}`),

  // Register / upsert user (admin use: create pre-seeded students)
  registerUser: (body) => req('/users/register', { method: 'POST', body: JSON.stringify(body) }),

  // ── Attendance ─────────────────────────────────────────────────────────
  // All attendance records for a user
  getAttendance: (auth0Id) => req(`/attendance/${auth0Id}`),

  // Stats for a section (marked/scanned/absent)
  getAttendanceStats: (section) => req(`/attendance/stats/${section}`),

  // Active session for a section
  getActiveSession: (section) => req(`/attendance/active-session/${section}`),

  // Stop a session
  stopSession: (auth0Id, section) =>
    req('/attendance/stop-session', { method: 'POST', body: JSON.stringify({ auth0Id, section }) }),

  // ── Notices ────────────────────────────────────────────────────────────
  getAllNotices: () => req('/notices'),
  getNoticesBySection: (section) => req(`/notices/section/${section}`),
  createNotice: (body) => req('/notices', { method: 'POST', body: JSON.stringify(body) }),
  updateNotice: (id, body) => req(`/notices/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteNotice: (id) => req(`/notices/${id}`, { method: 'DELETE' }),

  // ── Assignments ────────────────────────────────────────────────────────
  getAssignmentsBySection: (section) => req(`/assignments/section/${section}`),
  getAssignmentsByTeacher: (auth0Id) => req(`/assignments/teacher/${auth0Id}`),
  createAssignment: (body) => req('/assignments', { method: 'POST', body: JSON.stringify(body) }),
  updateAssignment: (id, body) => req(`/assignments/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteAssignment: (id) => req(`/assignments/${id}`, { method: 'DELETE' }),

  // ── Leaderboard ────────────────────────────────────────────────────────
  getLeaderboard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return req(`/leaderboard/top-students?${q}`);
  },
};
