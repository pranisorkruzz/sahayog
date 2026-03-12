// Shared navbar builder — injected by each page
// window.__USER__ is set by the server before this runs

function buildNavbar() {
  const u = window.__USER__ || {};
  const initial = u.name ? u.name.charAt(0).toUpperCase() : '?';

  let rightSide = '';
  if (u.loggedIn) {
    if (u.role === 'admin') {
      rightSide = `
        <a href="/admin" class="btn-nav-primary btn">⚙ Admin Panel</a>
        <div class="user-badge">
          <div class="avatar">${initial}</div>
          <span>${u.name}</span>
        </div>
        <a href="/logout">Logout</a>`;
    } else {
      rightSide = `
        <a href="/browse">Browse</a>
        <a href="/create" class="btn-nav-primary btn">+ Start Campaign</a>
        <a href="/my-campaigns">My Campaigns</a>
        <div class="user-badge">
          <div class="avatar">${initial}</div>
          <span>${u.name}</span>
        </div>
        <a href="/logout">Logout</a>`;
    }
  } else {
    rightSide = `
      <a href="/browse">Browse</a>
      <a href="/login">Log In</a>
      <a href="/register" class="btn-nav-primary btn">Get Started</a>`;
  }

  document.getElementById('navbar-placeholder').innerHTML = `
    <nav class="navbar">
      <div class="navbar-inner">
        <a href="/" class="navbar-logo">🌱 <span>Saha</span>yog</a>
        <div class="navbar-links">${rightSide}</div>
      </div>
    </nav>`;
}

document.addEventListener('DOMContentLoaded', buildNavbar);
