require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'university-admin-2026-secret';

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'university_api_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function requireAdmin(req, res, next) {
  const provided = req.get('x-admin-key');
  if (!provided || provided !== ADMIN_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized', message: 'A valid x-admin-key header is required.' });
  }
  next();
}

async function logUsage(keyId, req, status) {
  await pool.execute(
    'INSERT INTO api_usage (api_key_id, endpoint, http_method, response_status) VALUES (?, ?, ?, ?)',
    [keyId || null, req.originalUrl, req.method, status]
  );
}

// API key middleware: validates the key, checks status/limit, records usage, and attaches its owner.
const requireApiKey = asyncHandler(async (req, res, next) => {
  const rawKey = req.get('x-api-key');
  if (!rawKey) return res.status(401).json({ error: 'Unauthorized', message: 'Enter an API key in the x-api-key header.' });

  const [rows] = await pool.execute(
    `SELECT id, role, student_id, teacher_id, request_limit, usage_count, status
     FROM api_keys WHERE key_hash = ? LIMIT 1`,
    [sha256(rawKey)]
  );
  if (!rows.length) {
    await logUsage(null, req, 401);
    return res.status(401).json({ error: 'Unauthorized', message: 'The API key is invalid.' });
  }

  const key = rows[0];
  if (key.status !== 'active') {
    await logUsage(key.id, req, 403);
    return res.status(403).json({ error: 'Forbidden', message: 'This API key has been revoked.' });
  }

  // Atomic conditional update prevents concurrent requests exceeding the configured limit.
  const [update] = await pool.execute(
    `UPDATE api_keys SET usage_count = usage_count + 1
     WHERE id = ? AND status = 'active' AND usage_count < request_limit`,
    [key.id]
  );
  if (update.affectedRows !== 1) {
    await logUsage(key.id, req, 429);
    return res.status(429).json({ error: 'Request limit reached', message: 'This API key has used all its allowed requests.' });
  }

  key.usage_count += 1;
  req.apiKey = key;
  res.set('X-RateLimit-Limit', String(key.request_limit));
  res.set('X-RateLimit-Remaining', String(Math.max(0, key.request_limit - key.usage_count)));
  res.on('finish', () => { logUsage(key.id, req, res.statusCode).catch((err) => console.error('Usage logging failed:', err.message)); });
  next();
});

function requireRole(role) {
  return (req, res, next) => {
    if (!req.apiKey || req.apiKey.role !== role) {
      return res.status(403).json({ error: 'Forbidden', message: `This endpoint is available to ${role} API keys only.` });
    }
    next();
  };
}

app.get('/api/health', asyncHandler(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'ok', database: 'connected', application: 'University API Access Management System' });
}));

// ADMIN API — every administrative endpoint is protected by x-admin-key.
app.get('/api/admin/overview', requireAdmin, asyncHandler(async (_req, res) => {
  const [[students]] = await pool.query('SELECT COUNT(*) AS total FROM students');
  const [[teachers]] = await pool.query('SELECT COUNT(*) AS total FROM teachers');
  const [[keys]] = await pool.query("SELECT COUNT(*) AS total, SUM(status='active') AS active, SUM(status='revoked') AS revoked FROM api_keys");
  const [[usage]] = await pool.query('SELECT COUNT(*) AS total FROM api_usage');
  res.json({ students: students.total, teachers: teachers.total, totalKeys: keys.total, activeKeys: keys.active || 0, revokedKeys: keys.revoked || 0, requests: usage.total });
}));

app.get('/api/admin/students', requireAdmin, asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, roll_number, full_name, email, department, semester FROM students ORDER BY id');
  res.json(rows);
}));

app.get('/api/admin/teachers', requireAdmin, asyncHandler(async (_req, res) => {
  const [rows] = await pool.query('SELECT id, employee_number, full_name, email, department FROM teachers ORDER BY id');
  res.json(rows);
}));

// ADMIN API — add people first; newly created records are immediately available for key assignment.
app.post('/api/admin/students', requireAdmin, asyncHandler(async (req, res) => {
  const { rollNumber, fullName, email, department, semester } = req.body;
  const sem = Number(semester);
  if (![rollNumber, fullName, email, department].every(v => typeof v === 'string' && v.trim()) || !Number.isInteger(sem) || sem < 1 || sem > 20) {
    return res.status(400).json({ error: 'Validation error', message: 'Provide roll number, full name, email, department, and a semester from 1 to 20.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO students (roll_number, full_name, email, department, semester) VALUES (?, ?, ?, ?, ?)',
      [rollNumber.trim(), fullName.trim(), email.trim(), department.trim(), sem]
    );
    res.status(201).json({ message: 'Student added successfully.', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate record', message: 'Roll number or email already exists.' });
    throw error;
  }
}));

app.post('/api/admin/teachers', requireAdmin, asyncHandler(async (req, res) => {
  const { employeeNumber, fullName, email, department } = req.body;
  if (![employeeNumber, fullName, email, department].every(v => typeof v === 'string' && v.trim())) {
    return res.status(400).json({ error: 'Validation error', message: 'Provide employee number, full name, email, and department.' });
  }
  try {
    const [result] = await pool.execute(
      'INSERT INTO teachers (employee_number, full_name, email, department) VALUES (?, ?, ?, ?)',
      [employeeNumber.trim(), fullName.trim(), email.trim(), department.trim()]
    );
    res.status(201).json({ message: 'Teacher added successfully.', id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Duplicate record', message: 'Employee number or email already exists.' });
    throw error;
  }
}));

app.get('/api/admin/keys', requireAdmin, asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT k.id, k.key_prefix, k.role, k.student_id, k.teacher_id,
            COALESCE(s.full_name, t.full_name) AS owner_name,
            k.request_limit, k.usage_count, k.status, k.created_at, k.revoked_at
     FROM api_keys k
     LEFT JOIN students s ON s.id = k.student_id
     LEFT JOIN teachers t ON t.id = k.teacher_id
     ORDER BY k.created_at DESC, k.id DESC`
  );
  res.json(rows);
}));

app.get('/api/admin/usage', requireAdmin, asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT u.id, u.endpoint, u.http_method, u.response_status, u.created_at,
            COALESCE(k.key_prefix, 'Unknown / deleted key') AS key_prefix,
            k.role, COALESCE(s.full_name, t.full_name, 'Unassigned') AS owner_name
     FROM api_usage u LEFT JOIN api_keys k ON k.id = u.api_key_id
     LEFT JOIN students s ON s.id = k.student_id LEFT JOIN teachers t ON t.id = k.teacher_id
     ORDER BY u.created_at DESC LIMIT 100`
  );
  res.json(rows);
}));

app.post('/api/admin/keys', requireAdmin, asyncHandler(async (req, res) => {
  const { role, ownerId, requestLimit } = req.body;
  const limit = Number(requestLimit);
  if (!['student', 'teacher'].includes(role)) return res.status(400).json({ error: 'Validation error', message: 'Role must be student or teacher.' });
  if (!Number.isInteger(Number(ownerId)) || Number(ownerId) < 1) return res.status(400).json({ error: 'Validation error', message: 'Select a valid student or teacher.' });
  if (!Number.isInteger(limit) || limit < 1 || limit > 10000) return res.status(400).json({ error: 'Validation error', message: 'Request limit must be between 1 and 10000.' });

  const table = role === 'student' ? 'students' : 'teachers';
  const [owners] = await pool.execute(`SELECT id FROM ${table} WHERE id = ?`, [Number(ownerId)]);
  if (!owners.length) return res.status(404).json({ error: 'Not found', message: `${role} was not found.` });

  const rawKey = `uni_${role}_${crypto.randomBytes(24).toString('hex')}`;
  const prefix = rawKey.slice(0, 16);
  const studentId = role === 'student' ? Number(ownerId) : null;
  const teacherId = role === 'teacher' ? Number(ownerId) : null;
  const [result] = await pool.execute(
    'INSERT INTO api_keys (key_hash, key_prefix, role, student_id, teacher_id, request_limit) VALUES (?, ?, ?, ?, ?, ?)',
    [sha256(rawKey), prefix, role, studentId, teacherId, limit]
  );
  res.status(201).json({ message: 'API key generated. Copy it now; the full key is not stored or shown again.', id: result.insertId, apiKey: rawKey, keyPrefix: prefix });
}));

app.patch('/api/admin/keys/:id/limit', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const limit = Number(req.body.requestLimit);
  if (!Number.isInteger(id) || id < 1 || !Number.isInteger(limit) || limit < 1 || limit > 10000) {
    return res.status(400).json({ error: 'Validation error', message: 'Provide a valid key ID and request limit (1–10000).' });
  }
  const [result] = await pool.execute("UPDATE api_keys SET request_limit = ? WHERE id = ? AND status = 'active'", [limit, id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found', message: 'Active API key not found.' });
  res.json({ message: 'Request limit updated.' });
}));

app.patch('/api/admin/keys/:id/revoke', requireAdmin, asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: 'Validation error', message: 'Invalid key ID.' });
  const [result] = await pool.execute("UPDATE api_keys SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'", [id]);
  if (!result.affectedRows) return res.status(404).json({ error: 'Not found', message: 'Active API key not found or already revoked.' });
  res.json({ message: 'API key revoked successfully.' });
}));

// STUDENT API — the student ID is taken from the validated key, never from the URL/query.
app.get('/api/student/me', requireApiKey, requireRole('student'), asyncHandler(async (req, res) => {
  const [students] = await pool.execute(
    'SELECT id, roll_number, full_name, email, department, semester FROM students WHERE id = ?',
    [req.apiKey.student_id]
  );
  if (!students.length) return res.status(404).json({ error: 'Not found', message: 'Student record not found.' });
  const [marks] = await pool.execute(
    'SELECT subject_code, subject_name, semester, marks_obtained, total_marks, ROUND(marks_obtained / total_marks * 100, 1) AS percentage FROM academic_marks WHERE student_id = ? ORDER BY semester, subject_name',
    [req.apiKey.student_id]
  );
  res.json({ student: students[0], marks });
}));

// TEACHER API — only a teacher key can access the class-wide records.
app.get('/api/teacher/students', requireApiKey, requireRole('teacher'), asyncHandler(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT s.id, s.roll_number, s.full_name, s.email, s.department, s.semester,
            m.subject_code, m.subject_name, m.marks_obtained, m.total_marks,
            ROUND(m.marks_obtained / m.total_marks * 100, 1) AS percentage
     FROM students s LEFT JOIN academic_marks m ON m.student_id = s.id
     ORDER BY s.full_name, m.subject_name`
  );
  const grouped = new Map();
  for (const row of rows) {
    if (!grouped.has(row.id)) grouped.set(row.id, { id: row.id, roll_number: row.roll_number, full_name: row.full_name, email: row.email, department: row.department, semester: row.semester, marks: [] });
    if (row.subject_code) grouped.get(row.id).marks.push({ subject_code: row.subject_code, subject_name: row.subject_name, marks_obtained: row.marks_obtained, total_marks: row.total_marks, percentage: row.percentage });
  }
  res.json([...grouped.values()]);
}));

// API error handler keeps unexpected server/database details out of client responses.
app.use((err, _req, res, _next) => {
  console.error(err.stack || err);
  if (res.headersSent) return;
  res.status(500).json({ error: 'Internal server error', message: 'Something went wrong. Check the Node.js terminal for details.' });
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

(async () => {
  try {
    await pool.query('SELECT 1');
    app.listen(PORT, () => {
      console.log(`\nUniversity API Access Management System running at http://localhost:${PORT}`);
      console.log(`Admin panel: http://localhost:${PORT}/admin`);
      console.log(`Database: ${process.env.DB_NAME || 'university_api_db'}`);
      console.log('Use the admin key from .env for administrative requests.\n');
    });
  } catch (error) {
    console.error('Could not connect to MySQL. Check XAMPP, schema.sql, and .env settings.');
    console.error(error.message);
    process.exit(1);
  }
})();
