const express = require("express");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const bcrypt = require("bcrypt");

const app = express();

// ---------------------------
// MySQL connection
// ---------------------------
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Tlmcbolte550@@@", // ← your MySQL password
  database: "sahayog",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

// ---------------------------
// Middleware
// ---------------------------
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "sahayog-secret",
    resave: false,
    saveUninitialized: false,
  })
);

// ---------------------------
// Multer for file uploads
// ---------------------------
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ---------------------------
// Auth & Role helpers
// ---------------------------
function isLoggedIn(req, res, next) {
  if (!req.session.userId) return res.redirect("/login?next=" + encodeURIComponent(req.originalUrl));
  next();
}

function isAdmin(req, res, next) {
  if (!req.session.userId || req.session.role !== "admin") {
    return res.status(403).sendFile(path.join(__dirname, "views/403.html"));
  }
  next();
}

// Helper: inject user state as a JS global into any HTML page
function renderPage(filePath, req, res, extras = {}) {
  let html = fs.readFileSync(filePath, "utf8");

  // Replace any template placeholders first
  for (const [key, val] of Object.entries(extras)) {
    html = html.split(`{{${key}}}`).join(val ?? "");
  }

  // Inject user session data as a script tag
  const userPayload = JSON.stringify({
    loggedIn: !!req.session.userId,
    name: req.session.userName || null,
    role: req.session.role || null,
  });
  html = html.replace("</head>", `  <script>window.__USER__ = ${userPayload};</script>\n</head>`);

  res.send(html);
}

// ---------------------------
// Routes — Auth
// ---------------------------
app.get("/login", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  renderPage(path.join(__dirname, "views/login.html"), req, res);
});

app.get("/register", (req, res) => {
  if (req.session.userId) return res.redirect("/");
  renderPage(path.join(__dirname, "views/register.html"), req, res);
});

app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const next = req.query.next || "/";
  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.redirect("/login?error=invalid");
    const user = results[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.redirect("/login?error=invalid");
    req.session.userId = user.id;
    req.session.userName = user.name;
    req.session.role = user.role;
    // redirect to admin panel if admin
    if (user.role === "admin") return res.redirect("/admin");
    res.redirect(next);
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')",
    [name, email, hashed],
    (err) => {
      if (err) return res.redirect("/register?error=exists");
      res.redirect("/login?registered=1");
    }
  );
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// ---------------------------
// Routes — Public Pages
// ---------------------------

// Homepage — PUBLIC (no auth required)
app.get("/", (req, res) => {
  renderPage(path.join(__dirname, "views/index.html"), req, res);
});

// Browse — PUBLIC, shows only approved campaigns
app.get("/browse", (req, res) => {
  const sql = `
    SELECT c.id, c.title, c.images, c.goal_amount, c.raised_amount, c.created_at, u.name AS creator
    FROM campaigns c
    LEFT JOIN users u ON c.user_id = u.id
    WHERE c.status = 'approved'
    ORDER BY c.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) { console.error(err); return res.send("Database error"); }

    let campaignsHTML = "";
    if (results.length === 0) {
      campaignsHTML = `<div class="empty-state"><p>No approved campaigns yet. Be the first!</p><a href="/create" class="btn btn-primary">Start a Campaign</a></div>`;
    } else {
      results.forEach((c) => {
        const images = c.images ? JSON.parse(c.images) : [];
        const thumb = images.length > 0 ? `/uploads/${images[0]}` : "/images/placeholder.svg";
        const goal = c.goal_amount ? `<span class="goal">Goal: ₹${Number(c.goal_amount).toLocaleString()}</span>` : "";
        const pct = c.goal_amount ? Math.min(100, Math.round((c.raised_amount / c.goal_amount) * 100)) : 0;
        const progress = c.goal_amount
          ? `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><p class="progress-label">₹${Number(c.raised_amount || 0).toLocaleString()} raised · ${pct}%</p>`
          : "";

        campaignsHTML += `
          <a href="/campaign/${c.id}" class="campaign-card">
            <div class="card-img-wrap">
              <img src="${thumb}" alt="${c.title}" loading="lazy" />
            </div>
            <div class="card-body">
              <h3 class="card-title">${c.title}</h3>
              <p class="card-creator">by ${c.creator || "Anonymous"}</p>
              ${goal}
              ${progress}
            </div>
          </a>`;
      });
    }

    renderPage(path.join(__dirname, "views/browse.html"), req, res, { CAMPAIGNS: campaignsHTML });
  });
});

// Campaign detail — PUBLIC
app.get("/campaign/:id", (req, res) => {
  db.query(
    `SELECT c.*, u.name AS creator FROM campaigns c LEFT JOIN users u ON c.user_id = u.id WHERE c.id = ? AND c.status = 'approved'`,
    [req.params.id],
    (err, results) => {
      if (err || results.length === 0) return res.redirect("/browse");
      const c = results[0];
      const images = c.images ? JSON.parse(c.images) : [];
      let imagesHTML = images.length
        ? images.map((img) => `<img src="/uploads/${img}" alt="Campaign image" />`).join("")
        : `<div class="no-image">No images uploaded</div>`;

      const goal = c.goal_amount ? `<div class="stat"><span class="stat-label">Goal</span><span class="stat-value">₹${Number(c.goal_amount).toLocaleString()}</span></div>` : "";
      const raised = c.goal_amount ? `<div class="stat"><span class="stat-label">Raised</span><span class="stat-value">₹${Number(c.raised_amount || 0).toLocaleString()}</span></div>` : "";
      const pct = c.goal_amount ? Math.min(100, Math.round(((c.raised_amount || 0) / c.goal_amount) * 100)) : 0;
      const progress = c.goal_amount
        ? `<div class="progress-bar large"><div class="progress-fill" style="width:${pct}%"></div></div><p class="progress-pct">${pct}% funded</p>`
        : "";

      renderPage(path.join(__dirname, "views/campaign.html"), req, res, {
        TITLE: c.title,
        DESCRIPTION: c.description,
        IMAGES: imagesHTML,
        ID: c.id,
        CREATOR: c.creator || "Anonymous",
        STATS: goal + raised,
        PROGRESS: progress,
        DATE: new Date(c.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }),
      });
    }
  );
});

// ---------------------------
// Routes — Authenticated User
// ---------------------------
app.get("/create", isLoggedIn, (req, res) => {
  renderPage(path.join(__dirname, "views/create.html"), req, res);
});

app.post("/create", isLoggedIn, upload.array("documents", 10), (req, res) => {
  const { title, description, goal_amount } = req.body;
  const files = req.files.map((f) => f.filename);
  db.query(
    "INSERT INTO campaigns (user_id, title, description, images, goal_amount, status) VALUES (?, ?, ?, ?, ?, 'pending')",
    [req.session.userId, title, description, JSON.stringify(files), goal_amount || null],
    (err) => {
      if (err) { console.error(err); return res.send("Database error"); }
      res.redirect("/my-campaigns");
    }
  );
});

// My campaigns — logged in user
app.get("/my-campaigns", isLoggedIn, (req, res) => {
  db.query(
    "SELECT * FROM campaigns WHERE user_id = ? ORDER BY id DESC",
    [req.session.userId],
    (err, results) => {
      if (err) return res.send("Database error");
      let rows = "";
      results.forEach((c) => {
        const statusClass = { pending: "badge-pending", approved: "badge-approved", declined: "badge-declined" }[c.status] || "";
        rows += `<tr>
          <td>${c.title}</td>
          <td><span class="badge ${statusClass}">${c.status}</span></td>
          <td>${c.admin_note ? `<em>${c.admin_note}</em>` : "—"}</td>
          <td>${new Date(c.created_at).toLocaleDateString("en-IN")}</td>
        </tr>`;
      });
      renderPage(path.join(__dirname, "views/my-campaigns.html"), req, res, { ROWS: rows || `<tr><td colspan="4" class="empty-row">No campaigns yet.</td></tr>` });
    }
  );
});

// ---------------------------
// Routes — Admin Panel
// ---------------------------
app.get("/admin", isLoggedIn, isAdmin, (req, res) => {
  db.query(
    `SELECT c.*, u.name AS creator, u.email AS creator_email FROM campaigns c
     LEFT JOIN users u ON c.user_id = u.id
     ORDER BY FIELD(c.status,'pending','approved','declined'), c.id DESC`,
    (err, results) => {
      if (err) return res.send("Database error");

      const pending = results.filter((r) => r.status === "pending");
      const others = results.filter((r) => r.status !== "pending");

      function buildRow(c) {
        const images = c.images ? JSON.parse(c.images) : [];
        const docs = images.map((img) => `<a href="/uploads/${img}" target="_blank" class="doc-link">📄 View</a>`).join(" ");
        const statusClass = { pending: "badge-pending", approved: "badge-approved", declined: "badge-declined" }[c.status] || "";
        const actions = c.status === "pending"
          ? `<form class="admin-action" method="POST" action="/admin/campaign/${c.id}/approve">
               <input type="text" name="note" placeholder="Optional note…" class="admin-note-input" />
               <button type="submit" class="btn-approve">✓ Approve</button>
             </form>
             <form class="admin-action" method="POST" action="/admin/campaign/${c.id}/decline">
               <input type="text" name="note" placeholder="Reason for decline…" class="admin-note-input" />
               <button type="submit" class="btn-decline">✕ Decline</button>
             </form>`
          : `<span class="badge ${statusClass}">${c.status}</span>${c.admin_note ? `<br><small>${c.admin_note}</small>` : ""}`;

        return `<tr>
          <td><strong>${c.title}</strong><br><small>${c.creator || "?"} · ${c.creator_email || ""}</small></td>
          <td class="desc-cell">${(c.description || "").substring(0, 120)}…</td>
          <td>${docs || "—"}</td>
          <td>${new Date(c.created_at).toLocaleDateString("en-IN")}</td>
          <td>${actions}</td>
        </tr>`;
      }

      const pendingRows = pending.map(buildRow).join("") || `<tr><td colspan="5" class="empty-row">No pending campaigns 🎉</td></tr>`;
      const otherRows = others.map(buildRow).join("") || `<tr><td colspan="5" class="empty-row">No reviewed campaigns yet.</td></tr>`;

      renderPage(path.join(__dirname, "views/admin.html"), req, res, {
        PENDING_ROWS: pendingRows,
        OTHER_ROWS: otherRows,
        PENDING_COUNT: pending.length,
      });
    }
  );
});

app.post("/admin/campaign/:id/approve", isLoggedIn, isAdmin, (req, res) => {
  const { note } = req.body;
  db.query(
    "UPDATE campaigns SET status = 'approved', admin_note = ? WHERE id = ?",
    [note || null, req.params.id],
    () => res.redirect("/admin")
  );
});

app.post("/admin/campaign/:id/decline", isLoggedIn, isAdmin, (req, res) => {
  const { note } = req.body;
  db.query(
    "UPDATE campaigns SET status = 'declined', admin_note = ? WHERE id = ?",
    [note || null, req.params.id],
    () => res.redirect("/admin")
  );
});

// ---------------------------
// Start server
// ---------------------------
app.listen(3000, () => console.log("✅ Sahayog running → http://localhost:3000"));
