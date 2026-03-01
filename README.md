# AttendInn Admin Panel

A full React admin dashboard for managing AttendInn — users, attendance, sessions, notices, assignments, and leaderboard.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure Auth0

Open `src/index.js` and replace `YOUR_AUTH0_CLIENT_ID` with your actual Auth0 client ID:

```js
clientId="YOUR_AUTH0_CLIENT_ID"
```

To get this:
1. Go to https://manage.auth0.com
2. Applications → Create Application → Single Page Application
3. Copy the **Client ID**
4. In **Allowed Callback URLs**: add `http://localhost:3000` and your production URL
5. In **Allowed Logout URLs**: same
6. In **Allowed Web Origins**: same

### 3. Add Admin Role to Auth0 Users

For production, restrict access by role. In your Auth0 dashboard:
- Create a role called `admin`  
- Assign it to admin users
- The app currently allows any authenticated user — add role-checking in `App.jsx` if you want to lock it down

### 4. Run locally
```bash
npm start
```

---

## Deployment (Vercel — recommended)

```bash
npm install -g vercel
vercel
```

Or deploy to Netlify:
```bash
npm run build
# drag the /build folder to netlify.com/drop
```

---

## What each page does

| Page | What you can do |
|------|----------------|
| **Dashboard** | Live stats for all 20 sections — OTP marked, at door, absent, active sessions. Auto-refreshes every 30s |
| **Users** | Search/filter all students & teachers. Lookup by Auth0 ID. Edit user details, RFID UID, section, role |
| **Attendance** | Live section view (marked/scanned/absent lists). Individual record lookup by Auth0 ID with CSV export |
| **Sessions** | See all active sessions across all sections. View OTP, teacher, location. Force-stop sessions |
| **Assignments** | View/create/edit/delete assignments by section. View all student submissions with file links |
| **Notices** | View/create/edit/delete notices. Target specific sections. Add links |
| **Leaderboard** | Global and per-section leaderboard with bar chart. Score = attendance × 10 + submissions × 20 |

---

## Backend API used

Base URL: `https://attendinn-backend.vercel.app/api`

All routes are in `src/utils/api.js`. No new backend routes needed — the admin panel works entirely with your existing endpoints.

---

## Notes

- The **Sessions force-stop** requires a valid teacher Auth0 ID (saved in localStorage). This is because your `/stop-session` API validates teacher ownership. You can add a dedicated admin override route to the backend if needed.
- User creation uses `/users/register` — this upserts, so editing existing users works too.
- RFID UID field in the user editor lets you assign/change cards without touching the database directly.
