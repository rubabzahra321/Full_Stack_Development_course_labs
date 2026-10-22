const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

// Theme toggle: remembers the user's choice in this browser.
const THEME_STORAGE_KEY = 'uniaccess_theme';
function applyTheme(theme) {
  const dark = theme === 'dark';
  document.body.classList.toggle('dark-theme', dark);
  const button = $('#theme-toggle');
  if (button) {
    button.querySelector('.theme-toggle-icon').textContent = dark ? '☀' : '☾';
    button.querySelector('.theme-toggle-label').textContent = dark ? 'Light mode' : 'Dark mode';
    button.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    button.title = dark ? 'Switch to light theme' : 'Switch to dark theme';
  }
}
applyTheme(localStorage.getItem(THEME_STORAGE_KEY) || 'light');
$('#theme-toggle')?.addEventListener('click', () => {
  const nextTheme = document.body.classList.contains('dark-theme') ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  applyTheme(nextTheme);
});

// ---------- UI polish: animations & helpers ----------
const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function animateValue(el, to, duration = 900) {
  if (!el) return;
  const end = Number(to);
  if (prefersReduced || !Number.isFinite(end)) { el.textContent = to; return; }
  const start = performance.now();
  const from = 0;
  const tick = (now) => {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 4);
    el.textContent = Math.round(from + (end - from) * eased);
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
function revealActiveView() {
  $$('.view.active .welcome-row, .view.active .page-intro, .view.active .notice, .view.active .section-heading, .view.active .stat-card, .view.active .panel').forEach((el, i) => {
    el.classList.remove('reveal'); void el.offsetWidth;
    el.style.setProperty('--i', Math.min(i, 10));
    el.classList.add('reveal');
  });
}
function setLoading(on) {
  const bar = $('#load-bar'); if (!bar) return;
  if (on) { bar.style.opacity = 1; bar.style.width = '70%'; }
  else { bar.style.width = '100%'; setTimeout(() => { bar.style.opacity = 0; bar.style.width = '0'; }, 400); }
}
document.addEventListener('click', (event) => {   // button ripple effect
  const btn = event.target.closest('.button');
  if (!btn || prefersReduced) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const ripple = document.createElement('span');
  ripple.className = 'ripple';
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${event.clientX - rect.left - size / 2}px;top:${event.clientY - rect.top - size / 2}px`;
  btn.appendChild(ripple);
  setTimeout(() => ripple.remove(), 650);
});
window.addEventListener('scroll', () => $('.topbar')?.classList.toggle('scrolled', window.scrollY > 8), { passive: true });
const closeSidebar = () => { $('.sidebar').classList.remove('open'); $('#scrim').classList.remove('show'); };
$('#menu-button')?.addEventListener('click', () => { $('.sidebar').classList.add('open'); $('#scrim').classList.add('show'); });
$('#scrim')?.addEventListener('click', closeSidebar);

const STORAGE_KEYS = { student: 'uniaccess_student_key', teacher: 'uniaccess_teacher_key', admin: 'uniaccess_admin_key', role: 'uniaccess_selected_role' };
let adminUnlocked = false;
let currentGeneratedKey = '';
let cachedStudents = [];
let cachedTeachers = [];

const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const getKey = (role = localStorage.getItem(STORAGE_KEYS.role) || 'student') => localStorage.getItem(STORAGE_KEYS[role]) || '';
const adminKey = () => localStorage.getItem(STORAGE_KEYS.admin) || '';
const formatDate = (value) => value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';

function showToast(message, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  $('#toast-region').appendChild(toast);
  setTimeout(() => { toast.classList.add('out'); setTimeout(() => toast.remove(), 350); }, 3600);
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  let data;
  try { data = await response.json(); } catch { data = {}; }
  if (!response.ok) {
    const error = new Error(data.message || data.error || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return { data, response };
}

function showMessage(selector, message, type = '') {
  const element = $(selector);
  element.textContent = message;
  element.className = `inline-message ${type}`.trim();
}

function goToView(viewName) {
  const valid = ['dashboard', 'settings', 'admin'].includes(viewName) ? viewName : 'dashboard';
  $$('.view').forEach((view) => view.classList.toggle('active', view.id === `view-${valid}`));
  $$('.nav-link').forEach((link) => link.classList.toggle('active', link.dataset.view === valid));
  const labels = { dashboard: ['Dashboard', 'OVERVIEW'], settings: ['API settings', 'CONNECTION SETTINGS'], admin: ['Administration', 'ACCESS MANAGEMENT'] };
  $('#page-title').textContent = labels[valid][0];
  $('#breadcrumb').textContent = labels[valid][1];
  if (valid === 'settings') syncSettingsForm();
  if (valid === 'admin' && adminUnlocked) loadAdminData();
  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  revealActiveView();
  history.replaceState(null, '', valid === 'admin' ? '/admin' : valid === 'settings' ? '/settings' : '/');
}

$$('[data-view]').forEach((button) => button.addEventListener('click', () => goToView(button.dataset.view)));
$$('[data-go]').forEach((button) => button.addEventListener('click', () => goToView(button.dataset.go)));
$('#refresh-button').addEventListener('click', async () => {
  const btn = $('#refresh-button'); btn.classList.remove('spin'); void btn.offsetWidth; btn.classList.add('spin');
  if ($('#view-admin').classList.contains('active') && adminUnlocked) await loadAdminData();
  else await loadAcademicRecords();
});
$('#load-records-button').addEventListener('click', loadAcademicRecords);
$('#today-date').textContent = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

function syncSettingsForm() {
  const role = localStorage.getItem(STORAGE_KEYS.role) || 'student';
  $('#role-select').value = role;
  $('#api-key-input').value = getKey(role);
  showMessage('#settings-message', '');
}
$('#role-select').addEventListener('change', () => { $('#api-key-input').value = getKey($('#role-select').value); });
$('#toggle-key').addEventListener('click', () => {
  const input = $('#api-key-input');
  input.type = input.type === 'password' ? 'text' : 'password';
  $('#toggle-key').textContent = input.type === 'password' ? 'Show' : 'Hide';
});
function disconnectCurrentAccount({ goToSettings = true } = {}) {
  const activeRole = localStorage.getItem(STORAGE_KEYS.role) || $('#role-select')?.value || 'student';
  localStorage.removeItem(STORAGE_KEYS[activeRole]);
  resetDashboardForNewSession();
  $('#stat-role').textContent = '—';
  $('#stat-used').textContent = '—';
  $('#stat-total').textContent = '';
  $('#stat-records').textContent = '—';
  $('#stat-api').textContent = 'Ready';
  $('#api-caption').textContent = 'Waiting for API key';
  $('#usage-progress').style.width = '0%';
  $('#usage-caption').textContent = 'Save a key to view usage';
  $('#records-caption').textContent = 'Available after authentication';
  $('#academic-content').innerHTML = '<div class="empty-state"><div class="empty-illustration">▤</div><strong>Account disconnected</strong><p>Enter any API key previously assigned to you to connect again.</p><button class="button button-primary" data-go="settings">Enter API key</button></div>';
  $('#academic-content [data-go="settings"]')?.addEventListener('click', () => goToView('settings'));
  $('#session-status').className = 'status-pill neutral';
  $('#session-status').innerHTML = '<i></i> Not connected';
  $('#api-key-input').value = '';
  showMessage('#settings-message', 'Disconnected. Enter the API key for the account you want to use.');
  showToast('Account disconnected. You can enter another assigned key.', 'success');
  if (goToSettings) goToView('settings');
}

function resetDashboardForNewSession() {
  // Remove the previous user's information immediately when another key is submitted.
  $('#stat-role').textContent = '—';
  $('#stat-used').textContent = '—';
  $('#stat-total').textContent = '';
  $('#stat-records').textContent = '—';
  $('#stat-api').textContent = 'Checking';
  $('#api-caption').textContent = 'Validating the new API key';
  $('#usage-progress').style.width = '0%';
  $('#usage-caption').textContent = 'Loading usage for the selected key';
  $('#records-caption').textContent = 'Waiting for authenticated data';
  $('#academic-content').innerHTML = '<div class="empty-state"><div class="empty-illustration">▤</div><strong>Loading account data…</strong><p>The previous account data has been cleared.</p></div>';
  $('#session-status').className = 'status-pill neutral';
  $('#session-status').innerHTML = '<i></i> Checking key';
}

$('#settings-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const role = $('#role-select').value;
  const key = $('#api-key-input').value.trim();
  if (!key) return showMessage('#settings-message', 'Enter the API key assigned to you.', 'error');
  resetDashboardForNewSession();
  localStorage.setItem(STORAGE_KEYS[role], key);
  localStorage.setItem(STORAGE_KEYS.role, role);
  showMessage('#settings-message', 'Key saved in this browser. Checking your access…');
  try {
    await loadAcademicRecords();
    showMessage('#settings-message', 'Connected successfully. Your role permissions were validated.', 'success');
    showToast('API key saved and connection verified.', 'success');
    goToView('dashboard');
  } catch (error) {
    showMessage('#settings-message', `${error.message} Check that the selected role matches your key.`, 'error');
  }
});
$('#switch-account-button')?.addEventListener('click', () => disconnectCurrentAccount());
$('#clear-key').addEventListener('click', () => {
  const role = $('#role-select').value;
  localStorage.setItem(STORAGE_KEYS.role, role);
  disconnectCurrentAccount({ goToSettings: false });
  $('#role-select').value = role;
  $('#api-key-input').value = '';
  showMessage('#settings-message', `${role[0].toUpperCase() + role.slice(1)} account disconnected. Enter any previously assigned key to reconnect.`, 'success');
});

async function loadAcademicRecords() {
  const role = localStorage.getItem(STORAGE_KEYS.role) || $('#role-select')?.value || 'student';
  const key = getKey(role);
  if (!key) {
    $('#stat-role').textContent = '—'; $('#stat-used').textContent = '—'; $('#stat-total').textContent = '';
    $('#stat-records').textContent = '—'; $('#stat-api').textContent = 'Ready'; $('#api-caption').textContent = 'Waiting for API key';
    $('#academic-content').innerHTML = '<div class="empty-state"><div class="empty-illustration">▤</div><strong>No records loaded yet</strong><p>Save your assigned API key in settings, then load your academic information.</p><button class="button button-primary" data-go="settings">Set up API key</button></div>';
    $('#academic-content [data-go="settings"]')?.addEventListener('click', () => goToView('settings'));
    $('#session-status').className = 'status-pill neutral'; $('#session-status').innerHTML = '<i></i> Not connected';
    throw new Error('No saved API key. Open API settings first.');
  }
  $('#stat-api').textContent = 'Checking'; $('#api-caption').textContent = 'Validating key and permissions';
  setLoading(true);
  const endpoint = role === 'teacher' ? '/api/teacher/students' : '/api/student/me';
  try {
    const { data, response } = await apiRequest(endpoint, { headers: { 'x-api-key': key } });
    const used = Number(response.headers.get('X-RateLimit-Limit') || 0) - Number(response.headers.get('X-RateLimit-Remaining') || 0);
    const limit = Number(response.headers.get('X-RateLimit-Limit') || 0);
    $('#stat-role').textContent = role[0].toUpperCase() + role.slice(1);
    animateValue($('#stat-used'), used); $('#stat-total').textContent = `/ ${limit}`;
    $('#usage-progress').style.width = `${limit ? Math.min(100, used / limit * 100) : 0}%`;
    $('#usage-caption').textContent = `${Math.max(0, limit - used)} requests remaining`;
    $('#stat-api').textContent = 'Connected'; $('#api-caption').textContent = 'Authenticated successfully';
    $('#session-status').className = 'status-pill success'; $('#session-status').innerHTML = '<i></i> Connected';
    if (role === 'student') {
      renderStudentRecords(data);
      animateValue($('#stat-records'), data.marks.length);
      $('#records-caption').textContent = 'Subjects in your academic record';
    } else {
      renderTeacherRecords(data);
      const totalMarks = data.reduce((sum, student) => sum + student.marks.length, 0);
      animateValue($('#stat-records'), data.length);
      $('#records-caption').textContent = `${totalMarks} marks entries across all students`;
    }
    setLoading(false);
    return data;
  } catch (error) {
    setLoading(false);
    $('#stat-role').textContent = '—';
    $('#stat-used').textContent = '—'; $('#stat-total').textContent = '';
    $('#stat-records').textContent = '—';
    $('#usage-progress').style.width = '0%';
    $('#usage-caption').textContent = 'No usage loaded for this key';
    $('#records-caption').textContent = 'No authenticated records';
    $('#academic-content').innerHTML = '<div class="empty-state"><div class="empty-illustration">⚠</div><strong>Could not load account data</strong><p>The key was rejected or the request failed. Previous account data has been cleared. Check the role and API key, then try again.</p></div>';
    $('#stat-api').textContent = error.status === 401 || error.status === 403 ? 'Denied' : 'Error';
    $('#api-caption').textContent = error.message;
    $('#session-status').className = 'status-pill error'; $('#session-status').innerHTML = '<i></i> Access issue';
    throw error;
  }
}

function renderStudentRecords(data) {
  const s = data.student;
  const average = data.marks.length ? (data.marks.reduce((sum, mark) => sum + Number(mark.percentage), 0) / data.marks.length).toFixed(1) : '—';
  $('#academic-content').innerHTML = `<div class="student-summary"><div class="avatar large-avatar">${escapeHtml(s.full_name.split(' ').map(n => n[0]).slice(0, 2).join(''))}</div><div class="student-name"><h3>${escapeHtml(s.full_name)}</h3><p>${escapeHtml(s.roll_number)} · ${escapeHtml(s.department)}</p></div><span class="average-chip">${average}% <small>AVG.</small></span></div><div class="detail-grid"><div><small>Email</small><strong>${escapeHtml(s.email)}</strong></div><div><small>Semester</small><strong>${escapeHtml(s.semester)}</strong></div></div><div class="records-title"><strong>Academic marks</strong><span>${data.marks.length} subjects</span></div><div class="table-wrap"><table><thead><tr><th>SUBJECT</th><th>SEMESTER</th><th>MARKS</th><th>RESULT</th></tr></thead><tbody>${data.marks.map(m => `<tr><td><div class="subject-cell"><strong>${escapeHtml(m.subject_name)}</strong><small>${escapeHtml(m.subject_code)}</small></div></td><td>${escapeHtml(m.semester)}</td><td><strong>${Number(m.marks_obtained).toFixed(0)}</strong> / ${Number(m.total_marks).toFixed(0)}</td><td><span class="grade-bar"><i style="width:${Math.max(0,Math.min(100,Number(m.percentage)))}%"></i></span><small>${Number(m.percentage).toFixed(1)}%</small></td></tr>`).join('')}</tbody></table></div>`;
}

function renderTeacherRecords(students) {
  const marksTotal = students.reduce((sum, student) => sum + student.marks.length, 0);
  $('#academic-content').innerHTML = `<div class="teacher-summary"><div><strong>Class overview</strong><p>All student profiles and marks available to your teacher key.</p></div><div class="teacher-summary-stats"><span><b>${students.length}</b><small>STUDENTS</small></span><span><b>${marksTotal}</b><small>MARK ENTRIES</small></span></div></div><div class="table-wrap"><table><thead><tr><th>STUDENT</th><th>ROLL NUMBER</th><th>SEMESTER</th><th>SUBJECTS</th><th>AVERAGE</th></tr></thead><tbody>${students.map(s => { const avg = s.marks.length ? s.marks.reduce((sum,m)=>sum+Number(m.percentage),0)/s.marks.length : 0; return `<tr><td><div class="key-owner"><strong>${escapeHtml(s.full_name)}</strong><small>${escapeHtml(s.email)}</small></div></td><td>${escapeHtml(s.roll_number)}</td><td>${escapeHtml(s.semester)}</td><td>${s.marks.length}</td><td><strong>${s.marks.length ? avg.toFixed(1)+'%' : '—'}</strong></td></tr>`; }).join('')}</tbody></table></div>`;
}

// ADMIN PANEL
async function adminRequest(url, options = {}) {
  const headers = { 'x-admin-key': adminKey(), ...(options.headers || {}) };
  if (options.body) headers['Content-Type'] = 'application/json';
  return apiRequest(url, { ...options, headers });
}
$('#admin-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const key = $('#admin-key-input').value.trim();
  if (!key) return;
  localStorage.setItem(STORAGE_KEYS.admin, key);
  showMessage('#admin-login-message', 'Checking administrator credentials…');
  try {
    await adminRequest('/api/admin/overview');
    adminUnlocked = true;
    $('#admin-auth-panel').classList.add('hidden');
    $('#admin-workspace').classList.remove('hidden');
    showToast('Administrator access granted.', 'success');
    await loadAdminData();
  } catch (error) {
    localStorage.removeItem(STORAGE_KEYS.admin);
    showMessage('#admin-login-message', error.message, 'error');
  }
});

async function loadAdminData() {
  if (!adminUnlocked) return;
  setLoading(true);
  try {
    const [overviewResult, studentsResult, teachersResult, keysResult, usageResult] = await Promise.all([
      adminRequest('/api/admin/overview'), adminRequest('/api/admin/students'), adminRequest('/api/admin/teachers'), adminRequest('/api/admin/keys'), adminRequest('/api/admin/usage')
    ]);
    const overview = overviewResult.data;
    cachedStudents = studentsResult.data; cachedTeachers = teachersResult.data;
    animateValue($('#admin-students-count'), overview.students);
    animateValue($('#admin-teachers-count'), overview.teachers);
    animateValue($('#admin-active-count'), overview.activeKeys);
    animateValue($('#admin-requests-count'), overview.requests);
    renderOwnerOptions(); renderKeysTable(keysResult.data); renderUsageTable(usageResult.data);
    setLoading(false);
  } catch (error) {
    setLoading(false);
    showToast(`Could not load admin data: ${error.message}`, 'error');
    if (error.status === 401) { adminUnlocked = false; $('#admin-auth-panel').classList.remove('hidden'); $('#admin-workspace').classList.add('hidden'); }
  }
}

function renderOwnerOptions() {
  const role = $('#new-key-role').value;
  const people = role === 'student' ? cachedStudents : cachedTeachers;
  const placeholder = people.length ? 'Select an account…' : 'No accounts found';
  $('#new-key-owner').innerHTML = `<option value="">${placeholder}</option>${people.map(p => `<option value="${p.id}">${escapeHtml(p.full_name)} · ${escapeHtml(role === 'student' ? p.roll_number : p.employee_number)}</option>`).join('')}`;
}
$('#new-key-role').addEventListener('change', renderOwnerOptions);

$('#add-student-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  body.semester = Number(body.semester);
  try {
    const { data } = await adminRequest('/api/admin/students', { method: 'POST', body: JSON.stringify(body) });
    showMessage('#add-student-message', data.message, 'success');
    form.reset();
    $('#student-semester').value = 1;
    await loadAdminData();
    $('#new-key-role').value = 'student'; renderOwnerOptions();
    showToast('Student saved to MySQL and added to the key-assignment list.', 'success');
  } catch (error) { showMessage('#add-student-message', error.message, 'error'); }
});

$('#add-teacher-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const body = Object.fromEntries(new FormData(form).entries());
  try {
    const { data } = await adminRequest('/api/admin/teachers', { method: 'POST', body: JSON.stringify(body) });
    showMessage('#add-teacher-message', data.message, 'success');
    form.reset();
    await loadAdminData();
    $('#new-key-role').value = 'teacher'; renderOwnerOptions();
    showToast('Teacher saved to MySQL and added to the key-assignment list.', 'success');
  } catch (error) { showMessage('#add-teacher-message', error.message, 'error'); }
});

$('#generate-key-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const role = $('#new-key-role').value;
  const ownerId = Number($('#new-key-owner').value);
  const requestLimit = Number($('#new-key-limit').value);
  $('#new-key-result').classList.add('hidden');
  try {
    const { data } = await adminRequest('/api/admin/keys', { method: 'POST', body: JSON.stringify({ role, ownerId, requestLimit }) });
    currentGeneratedKey = data.apiKey;
    $('#generated-key-text').textContent = currentGeneratedKey;
    $('#new-key-result').classList.remove('hidden');
    showMessage('#generate-message', data.message, 'success');
    showToast('New API key created. Copy it before leaving this page.', 'success');
    await loadAdminData();
  } catch (error) { showMessage('#generate-message', error.message, 'error'); }
});
$('#copy-generated-key').addEventListener('click', async () => {
  if (!currentGeneratedKey) return;
  try { await navigator.clipboard.writeText(currentGeneratedKey); showToast('API key copied to clipboard.', 'success'); }
  catch { showToast('Clipboard unavailable. Select and copy the key manually.', 'error'); }
});
$('#admin-refresh').addEventListener('click', loadAdminData);

function renderKeysTable(keys) {
  const body = $('#keys-table-body');
  if (!keys.length) { body.innerHTML = '<tr><td colspan="6" class="table-empty">No API keys have been generated yet.</td></tr>'; return; }
  body.innerHTML = keys.map(k => {
    const percent = k.request_limit ? Math.min(100, Number(k.usage_count) / Number(k.request_limit) * 100) : 0;
    return `<tr><td><div class="key-owner"><strong>${escapeHtml(k.key_prefix)}••••</strong><small>${escapeHtml(k.owner_name || 'Unassigned')} · ID ${k.id}</small></div></td><td><span class="role-chip ${escapeHtml(k.role)}">${escapeHtml(k.role)}</span></td><td><div class="usage-cell"><strong>${k.usage_count} / ${k.request_limit}</strong><div class="usage-mini"><span style="width:${percent}%"></span></div></div></td><td><span class="status-chip ${escapeHtml(k.status)}">${escapeHtml(k.status)}</span></td><td>${escapeHtml(formatDate(k.created_at))}</td><td><div class="table-actions">${k.status === 'active' ? `<button class="mini-button" data-limit="${k.id}" data-current="${k.request_limit}">Edit limit</button><button class="mini-button danger" data-revoke="${k.id}">Revoke</button>` : '<span class="muted">No actions</span>'}</div></td></tr>`;
  }).join('');
  $$('[data-limit]').forEach(button => button.addEventListener('click', async () => {
    const answer = prompt('Enter the new total request limit (1–10000):', button.dataset.current);
    if (answer === null) return;
    const requestLimit = Number(answer);
    if (!Number.isInteger(requestLimit) || requestLimit < 1 || requestLimit > 10000) return showToast('Enter a whole number from 1 to 10000.', 'error');
    try { await adminRequest(`/api/admin/keys/${button.dataset.limit}/limit`, { method: 'PATCH', body: JSON.stringify({ requestLimit }) }); showToast('Request limit updated.', 'success'); await loadAdminData(); }
    catch (error) { showToast(error.message, 'error'); }
  }));
  $$('[data-revoke]').forEach(button => button.addEventListener('click', async () => {
    if (!confirm('Revoke this API key? It will no longer be able to access protected endpoints.')) return;
    try { await adminRequest(`/api/admin/keys/${button.dataset.revoke}/revoke`, { method: 'PATCH', body: JSON.stringify({}) }); showToast('API key revoked.', 'success'); await loadAdminData(); }
    catch (error) { showToast(error.message, 'error'); }
  }));
}

function renderUsageTable(events) {
  const body = $('#usage-table-body');
  if (!events.length) { body.innerHTML = '<tr><td colspan="5" class="table-empty">No API requests have been logged yet.</td></tr>'; return; }
  body.innerHTML = events.map(event => `<tr><td>${escapeHtml(formatDate(event.created_at))}</td><td><div class="key-owner"><strong>${escapeHtml(event.key_prefix)}</strong><small>${escapeHtml(event.owner_name)}</small></div></td><td><span class="method-chip">${escapeHtml(event.http_method)}</span></td><td>${escapeHtml(event.endpoint)}</td><td><span class="response-chip ${Number(event.response_status) < 400 ? 'good' : 'bad'}">${escapeHtml(event.response_status)}</span></td></tr>`).join('');
}

// Support direct navigation to /admin and /settings, including page refreshes.
const initialPath = window.location.pathname;
if (initialPath === '/admin') goToView('admin');
else if (initialPath === '/settings') goToView('settings');
else goToView('dashboard');
syncSettingsForm();
if (adminKey()) {
  $('#admin-key-input').value = adminKey();
  adminRequest('/api/admin/overview').then(() => { adminUnlocked = true; $('#admin-auth-panel').classList.add('hidden'); $('#admin-workspace').classList.remove('hidden'); if ($('#view-admin').classList.contains('active')) loadAdminData(); }).catch(() => {});
}
if (getKey()) loadAcademicRecords().catch(() => {});