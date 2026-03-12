# Sahayog v2.0 — Improved College Project

A community crowdfunding platform built with Node.js, Express, and MySQL.

---

## 🆕 What Changed from v1

| Feature | Before | After |
|---|---|---|
| Homepage | Required login to view | **Public** — visible to everyone |
| Auth flow | Wall before homepage | Login only when clicking **"Start Campaign"** or **"Log In"** |
| Campaign approval | Instant, no review | **Admin manually approves/declines** each campaign |
| Admin panel | None | **Separate `/admin` route** with document viewer |
| Browse page | Showed all campaigns | Shows only **approved** campaigns |
| Campaign status | None | `pending → approved / declined` with notes |
| User dashboard | None | **My Campaigns** page to track status |
| UI | Basic | **Full redesign** — consistent design system |

---

## 🚀 Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Run the database migration
Open your MySQL client and run `database_migration.sql`.

This will:
- Add `role` column to `users` (default `'user'`)
- Add `status`, `goal_amount`, `raised_amount`, `admin_note`, `created_at`, `user_id` to `campaigns`
- Create a default admin account: `admin@sahayog.com` / `Admin@1234`

### 3. Update your DB password
In `app.js`, line ~14:
```js
password: "YOUR_MYSQL_PASSWORD_HERE",
```

### 4. Create uploads folder
```bash
mkdir -p public/uploads
```

### 5. Start the server
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Visit → **http://localhost:3000**

---

## 👤 Roles

### Regular User
- Can view homepage and browse without logging in
- Must log in to create a campaign
- Submitting a campaign creates it with `status = 'pending'`
- Can track campaign status in **My Campaigns**

### Admin
- Logs in via `/login` → automatically redirected to `/admin`
- Admin panel shows all **pending** campaigns with documents
- Can **Approve** or **Decline** with optional notes
- Approved campaigns become live on `/browse`
- Declined campaigns show the note to the user in My Campaigns

### Making someone an admin
```sql
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';
```

---

## 📁 File Structure

```
sahayog/
├── app.js                  ← Main Express server
├── database_migration.sql  ← Run this to upgrade your DB
├── package.json
├── views/
│   ├── index.html          ← Public homepage
│   ├── login.html          ← Login page
│   ├── register.html       ← Registration page
│   ├── browse.html         ← Browse approved campaigns
│   ├── campaign.html       ← Campaign detail page
│   ├── create.html         ← Create campaign form
│   ├── my-campaigns.html   ← User's campaign dashboard
│   ├── admin.html          ← Admin review panel
│   └── 403.html            ← Forbidden page
└── public/
    ├── css/styles.css      ← Complete design system
    ├── js/navbar.js        ← Shared navbar component
    └── uploads/            ← Uploaded files stored here
```

---

## 🗄️ Database Schema

```sql
users:
  id, name, email, password, role (user/admin), created_at

campaigns:
  id, user_id, title, description, images (JSON), goal_amount,
  raised_amount, status (pending/approved/declined),
  admin_note, created_at
```
