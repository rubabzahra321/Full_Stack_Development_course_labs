// Main backend file: serves the website, creates tables, and provides API routes.
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json()); // Read JSON sent by the frontend.
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML, CSS and JS.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Show uploaded images.

// Save uploaded profile images in the uploads folder with a unique filename.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${Date.now()}${extension}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 3 * 1024 * 1024 }, // Maximum image size: 3 MB.
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Please upload an image file.'));
  }
});

// Create the required tables and insert starter portfolio information only once.
async function initializeDatabase() {
  await db.query(`CREATE TABLE IF NOT EXISTS profile (
    id INT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    headline VARCHAR(180) NOT NULL,
    about TEXT,
    email VARCHAR(150),
    location VARCHAR(150),
    github VARCHAR(255),
    linkedin VARCHAR(255),
    image_url VARCHAR(255) DEFAULT ''
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS skills (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(100) DEFAULT 'Technical'
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS education (
    id INT AUTO_INCREMENT PRIMARY KEY,
    institution VARCHAR(180) NOT NULL,
    degree VARCHAR(180) NOT NULL,
    period VARCHAR(100),
    details TEXT
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS experience (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role VARCHAR(180) NOT NULL,
    organization VARCHAR(180) NOT NULL,
    period VARCHAR(100),
    details TEXT
  )`);

  await db.query(`CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(180) NOT NULL,
    description TEXT,
    technologies VARCHAR(255),
    project_url VARCHAR(255)
  )`);

  // Default profile appears only when the profile table is empty.
  const [profiles] = await db.query('SELECT id FROM profile WHERE id = 1');
  if (profiles.length === 0) {
    await db.query(
      `INSERT INTO profile (id, full_name, headline, about, email, location, github, linkedin, image_url)
       VALUES (1, ?, ?, ?, ?, ?, ?, ?, '')`,
      ['Rubab Zahra', 'Computer Science Undergraduate | AI & Frontend Developer',
       'I am a Computer Science undergraduate at Air University, Kamra Campus, interested in frontend development, Generative AI, RAG and AI agents. I enjoy building useful applications and creating clear, responsive user interfaces.',
       '', 'Pakistan', 'https://github.com/rubabzahra321', 'https://www.linkedin.com/in/rubab-zahra-765827332/']
    );
  }

  const [skills] = await db.query('SELECT id FROM skills LIMIT 1');
  if (skills.length === 0) {
    await db.query('INSERT INTO skills (name, category) VALUES ?', [[
      ['HTML5', 'Frontend'], ['CSS3', 'Frontend'], ['JavaScript', 'Frontend'],
      ['React.js', 'Frontend'], ['Bootstrap', 'Frontend'], ['Python', 'Programming'],
      ['Generative AI', 'AI'], ['RAG', 'AI'], ['LangChain', 'AI'],
      ['MySQL', 'Database'], ['REST APIs', 'Backend'], ['Git & GitHub', 'Tools'],
      ['Image Annotation', 'Professional']
    ]]);
  }

  const [education] = await db.query('SELECT id FROM education LIMIT 1');
  if (education.length === 0) {
    await db.query('INSERT INTO education (institution, degree, period, details) VALUES (?, ?, ?, ?)',
      ['Air University, Kamra Campus', 'BS Computer Science', '5th Semester | In Progress', 'Third-year undergraduate student. Add or update academic details from the portfolio manager.']);
  }

  const [experience] = await db.query('SELECT id FROM experience LIMIT 1');
  if (experience.length === 0) {
    await db.query('INSERT INTO experience (role, organization, period, details) VALUES (?, ?, ?, ?)',
      ['Freelance Data Annotator', 'Freelance Projects', 'Current', 'Image annotation and data labeling work. Add client names or dates only when you are comfortable sharing them.']);
  }

  const [projects] = await db.query('SELECT id FROM projects LIMIT 1');
  if (projects.length === 0) {
    await db.query('INSERT INTO projects (title, description, technologies, project_url) VALUES (?, ?, ?, ?)',
      ['AI Knowledge Assistant', 'A document question-answering app that extracts text from PDFs, splits it into chunks, retrieves relevant information using semantic search, and generates answers with source context.', 'Python, Streamlit, LangChain, ChromaDB, Gemini', '']);
    await db.query('INSERT INTO projects (title, description, technologies, project_url) VALUES (?, ?, ?, ?)',
      ['AI Country Explorer', 'An interactive app for exploring country information with an AI-powered conversational interface.', 'Python, Streamlit, LangChain, Gemini', '']);
  }
}

// Return every portfolio section in one request so the page can render dynamically.
app.get('/api/portfolio', async (req, res) => {
  try {
    const [[profileRows], [skills], [education], [experience], [projects]] = await Promise.all([
      db.query('SELECT * FROM profile WHERE id = 1'),
      db.query('SELECT * FROM skills ORDER BY id DESC'),
      db.query('SELECT * FROM education ORDER BY id DESC'),
      db.query('SELECT * FROM experience ORDER BY id DESC'),
      db.query('SELECT * FROM projects ORDER BY id DESC')
    ]);
    res.json({ profile: profileRows[0] || null, skills, education, experience, projects });
  } catch (error) {
    res.status(500).json({ message: 'Could not load portfolio data.', error: error.message });
  }
});

// Update profile information. A single profile record (id = 1) is used for this lab.
app.put('/api/profile', async (req, res) => {
  try {
    const { full_name, headline, about, email, location, github, linkedin } = req.body;
    if (!full_name?.trim() || !headline?.trim()) {
      return res.status(400).json({ message: 'Name and headline are required.' });
    }
    await db.query(
      `UPDATE profile SET full_name=?, headline=?, about=?, email=?, location=?, github=?, linkedin=? WHERE id=1`,
      [full_name.trim(), headline.trim(), about || '', email || '', location || '', github || '', linkedin || '']
    );
    res.json({ message: 'Profile updated successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not update profile.', error: error.message });
  }
});

// Upload a profile image and save its URL in MySQL.
app.post('/api/profile/image', upload.single('profileImage'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Choose an image first.' });
    const imageUrl = `/uploads/${req.file.filename}`;
    const [oldRows] = await db.query('SELECT image_url FROM profile WHERE id=1');
    const oldUrl = oldRows[0]?.image_url;
    await db.query('UPDATE profile SET image_url=? WHERE id=1', [imageUrl]);
    // Remove the previous uploaded file after the new image has been saved.
    if (oldUrl && oldUrl.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, oldUrl.replace(/^\//, ''));
      if (fs.existsSync(oldPath)) fs.unlink(oldPath, () => {});
    }
    res.json({ message: 'Profile image updated.', image_url: imageUrl });
  } catch (error) {
    res.status(500).json({ message: 'Image upload failed.', error: error.message });
  }
});

// Reusable CRUD routes for skills, education, experience and projects.
const sections = {
  skills: { fields: ['name', 'category'], required: ['name'] },
  education: { fields: ['institution', 'degree', 'period', 'details'], required: ['institution', 'degree'] },
  experience: { fields: ['role', 'organization', 'period', 'details'], required: ['role', 'organization'] },
  projects: { fields: ['title', 'description', 'technologies', 'project_url'], required: ['title'] }
};

for (const [table, config] of Object.entries(sections)) {
  // Add a new item to the selected section.
  app.post(`/api/${table}`, async (req, res) => {
    try {
      for (const field of config.required) {
        if (!String(req.body[field] || '').trim()) {
          return res.status(400).json({ message: `${field} is required.` });
        }
      }
      const values = config.fields.map(field => req.body[field] || '');
      const placeholders = config.fields.map(() => '?').join(', ');
      await db.query(`INSERT INTO ${table} (${config.fields.join(', ')}) VALUES (${placeholders})`, values);
      res.status(201).json({ message: 'Item added successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Could not add item.', error: error.message });
    }
  });

  // Edit an existing item by its numeric ID.
  app.put(`/api/${table}/:id`, async (req, res) => {
    try {
      for (const field of config.required) {
        if (!String(req.body[field] || '').trim()) {
          return res.status(400).json({ message: `${field} is required.` });
        }
      }
      const values = config.fields.map(field => req.body[field] || '');
      const setClause = config.fields.map(field => `${field} = ?`).join(', ');
      const [result] = await db.query(`UPDATE ${table} SET ${setClause} WHERE id = ?`, [...values, req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ message: 'Item not found.' });
      res.json({ message: 'Item updated successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Could not update item.', error: error.message });
    }
  });

  // Delete an item by its numeric ID.
  app.delete(`/api/${table}/:id`, async (req, res) => {
    try {
      const [result] = await db.query(`DELETE FROM ${table} WHERE id = ?`, [req.params.id]);
      if (!result.affectedRows) return res.status(404).json({ message: 'Item not found.' });
      res.json({ message: 'Item deleted successfully.' });
    } catch (error) {
      res.status(500).json({ message: 'Could not delete item.', error: error.message });
    }
  });
}

// Return a helpful JSON error for unsupported API routes.
app.use('/api', (req, res) => res.status(404).json({ message: 'API endpoint not found.' }));

// Handle image upload and other unexpected errors without crashing the server.
app.use((error, req, res, next) => {
  res.status(400).json({ message: error.message || 'Request failed.' });
});

initializeDatabase()
  .then(() => app.listen(PORT, () => console.log(`Portfolio running at http://localhost:${PORT}`)))
  .catch(error => {
    console.error('Could not connect to MySQL. Check db.js and ensure MySQL is running.');
    console.error(error.message);
    process.exit(1);
  });
